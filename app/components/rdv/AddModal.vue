<script setup lang="ts">
import * as z from 'zod'
import type { FormError, FormErrorEvent, FormSubmitEvent, SelectMenuItem } from '@nuxt/ui'
import { CalendarDate, getLocalTimeZone } from '@internationalized/date'
import type { Patient, Organisation, Medecin, Article } from '~/types'

const schema = z.object({
    patient_id: z.string().min(2, 'Too short'),
    medecin_id: z.string().optional(),
    organisation_id: z.string(),
    service_id: z.string().optional(),
    date_rdv: z.date(),
    heure_rdv: z.string().optional(),
    motif: z.string().optional(),
    prestation_id: z.string(),
})
const toast = useToast()
const open = ref(false)
const emit = defineEmits(['rdv-added'])
const supabase = useSupabaseClient()
type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
    patient_id: undefined,
    medecin_id: undefined,
    organisation_id: undefined,
    service_id: undefined,
    date_rdv: undefined,
    heure_rdv: undefined,
    motif: undefined,
})
const inputDateRef = useTemplateRef('inputDateRef')
const itemsGenre = [
    { value: 'M', label: 'Masculin' },
    { value: 'F', label: 'Feminin' }
]
// ✅ Lazy fetch : les données ne sont chargées qu'à l'ouverture du slideover
const { data: patients, execute: fetchPatients } = useAsyncData<Patient[]>('rdv-patients', async () => {
    const { data, error } = await supabase.from('patients').select('id, nom, prenom, postnom')
    if (error) throw error
    return data as Patient[]
}, { immediate: false, lazy: true })

const { data: organisations, execute: fetchOrganisations } = useAsyncData<Organisation[]>('rdv-organisations', async () => {
    const { data, error } = await supabase.from('organisations').select('id, nom, lookup:lookups!inner(*)').eq('lookups.nom', 'Clinique')
    if (error) throw error
    return data as unknown as Organisation[]
}, { immediate: false, lazy: true })

const { data: medecins, execute: fetchMedecins } = useAsyncData<Medecin[]>('rdv-medecins', async () => {
    const { data, error } = await supabase.from('medecins').select('id, nom, prenom, postnom')
    if (error) throw error
    return data as Medecin[]
}, { immediate: false, lazy: true })

const { data: prestations, execute: fetchPrestations } = useAsyncData<Article[]>('rdv-prestations', async () => {
    const { data, error } = await supabase.from('articles').select('id, nom, code')
    if (error) throw error
    return data as Article[]
}, { immediate: false, lazy: true })

const { data: services, execute: fetchServices } = useAsyncData<Organisation[]>('rdv-services', async () => {
    const { data, error } = await supabase.from('organisations').select('id, nom, code, lookup:lookups!inner(*)')
        .eq('lookup.description', 'Service Médicale')
        .eq('organisation_parent_id', state.organisation_id || '')
    if (error) throw error
    return data as Organisation[]
}, { immediate: false, lazy: true })

// Déclenche les fetches uniquement à l'ouverture du slideover
watch(open, (isOpen) => {
    if (isOpen) {
        fetchPatients()
        fetchOrganisations()
        fetchMedecins()
        fetchPrestations()
        fetchServices()
    }
})

watch(state, () => {
    fetchServices()
})

const itemsPatients = computed<SelectMenuItem[]>(() => patients.value?.map(patient => ({
    label: patient?.nom + ' ' + patient?.prenom + ' ' + patient?.postnom,
    id: String(patient?.id)
})) || [])

const itemsOrganisations = computed<SelectMenuItem[]>(() => organisations.value?.map((organisation: Organisation) => ({
    label: organisation?.nom,
    id: String(organisation?.id)
})) || [])

const itemsMedecins = computed<SelectMenuItem[]>(() => medecins.value?.map((medecin: Medecin) => ({
    label: medecin?.nom,
    id: String(medecin?.id)
})) || [])

const itemsPrestations = computed<SelectMenuItem[]>(() => prestations.value?.map((prestation: Article) => ({
    label: prestation?.nom,
    id: String(prestation?.id)
})) || [])
const itemsServices = computed<SelectMenuItem[]>(() => services.value?.map((service: Organisation) => ({
    label: service?.nom,
    id: String(service?.id)
})) || [])


const maxDate = new CalendarDate(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate())
const toCalendarDate = (date: Date) => {
    return new CalendarDate(
        date.getFullYear(),
        date.getMonth() + 1,
        date.getDate()
    )
}

const dateNaissanceModel = computed({
    get: () => state.date_rdv ? toCalendarDate(state.date_rdv) : undefined,
    set: (value: CalendarDate | null) => {
        state.date_rdv = value ? value.toDate(getLocalTimeZone()) : undefined
    }
})

async function onSubmit(event: FormSubmitEvent<Schema>) {
    const { data, error } = await supabase
        .from('rdv')
        .insert(event?.data as any)
        .select()

    if (error) {
        toast.add({ title: 'Error', description: `Can't add new rendez-vous ${error.message}`, color: 'error' })
    } else {
        toast.add({ title: 'Succès', description: `Nouveau rendez-vous ajouté le ${event.data.date_rdv} à ${event.data.heure_rdv}`, color: 'success' })
        open.value = false
        emit('rdv-added')
    }
}

function onError(error: FormErrorEvent) {
    toast.add({ title: 'Error', description: error.errors[0]?.message, color: 'error' })
}

</script>

<template>
    <USlideover v-model:open="open" inset title="Nouveau rendez-vous" description="Ajouter un nouveau rendez-vous">
        <UButton label="Nouveau rendez-vous" icon="i-lucide-plus" />

        <template #body>
            <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit" @error="onError">
                <UFormField label="Patient" placeholder="John Doe" name="patient_id">
                    <USelectMenu v-model.trim="state.patient_id" value-key="id" :items="itemsPatients" class="w-full" />
                </UFormField>

                <!-- <UFormField label="Organisation" name="organisation_id">
                    <USelectMenu v-model.trim="state.organisation_id" value-key="id" :items="itemsOrganisations"
                        class="w-full" />
                </UFormField> -->
                <UFormField label="Service" name="service_id">
                    <USelectMenu v-model="state.service_id" value-key="id" :items="itemsServices" class="w-full"
                                 icon="material-symbols:medical-services-outline" />
                </UFormField>
                <UFormField label="Medecin" name="medecin_id">
                    <USelectMenu v-model.trim="state.medecin_id" value-key="id" :items="itemsMedecins" class="w-full" />
                </UFormField>
                <div class="flex flex-row gap-1">
                    <UFormField label="Date de rdv" placeholder="08/12/2025" name="date_rdv" class="w-full">
                        <UInputDate v-model="dateNaissanceModel" class="w-full" :max-date="maxDate">
                            <template #trailing>
                                <UPopover :reference="inputDateRef?.inputsRef[3]?.$el">
                                    <UButton color="neutral" variant="link" size="sm" icon="i-lucide-calendar"
                                             aria-label="Select a date" class="px-0" />

                                    <template #content>
                                        <UCalendar v-model="dateNaissanceModel" class="p-2" :max-date="maxDate" />
                                    </template>
                                </UPopover>
                            </template>
                        </UInputDate>
                    </UFormField>

                    <UFormField label="Heure de rdv" name="heure_rdv" class="w-full">
                        <UInput v-model="state.heure_rdv" type="time" class="w-full" icon="i-lucide-clock" />
                    </UFormField>
                </div>
                
                <UFormField label="Prestation" name="prestation_id">
                    <USelectMenu v-model="state.prestation_id" value-key="id" :items="itemsPrestations" class="w-full"
                                 icon="material-symbols:medical-services-outline" />
                </UFormField>

                <div class="flex justify-end gap-2">
                    <UButton label="Annuler" color="neutral" variant="subtle" @click="open = false" />
                    <UButton label="Ajouter" icon="i-lucide-plus" color="primary" variant="solid" type="submit" />
                </div>
            </UForm>
        </template>
    </USlideover>
</template>
