<script setup lang="ts">
import * as z from 'zod'
import type { FormErrorEvent, FormSubmitEvent, SelectMenuItem } from '@nuxt/ui'
import { CalendarDate, getLocalTimeZone } from '@internationalized/date'
import type { Lookup, Organisation, Patient } from '~/types'

const schema = z.object({
    patient_id: z.string().min(2, 'Veuillez selectionner un patient'),
    organisation_id: z.string().min(2, 'Veuillez selectionner une organisation'),
    date_debut: z.date().max(new Date(), 'Date de debut doit etre inferieur a la date actuelle')
})
const toast = useToast()
const open = ref(false)
const emit = defineEmits(['patient-added'])
const supabase = useSupabaseClient()
type Schema = z.output<typeof schema>
const inputDateDebutRef = useTemplateRef('inputDateDebutRef')

const dateDebutModel = computed({
    get: () => state.date_debut ? toCalendarDate(state.date_debut) : undefined,
    set: (value: CalendarDate | null) => {
        state.date_debut = value ? value.toDate(getLocalTimeZone()) : undefined
    }
})
const props = defineProps({
    organisationId: {
        type: String,
        required: true
    }
})

const state = reactive<Partial<Schema>>({
    patient_id: undefined,
    organisation_id: props.organisationId,
})

const { data: orga } = await useAsyncData<Organisation[]>('organisations-items', async () => {
    const { data } = await supabase.from('organisations').select('id, nom, description')
    return (data || []) as unknown as Organisation[]
})
const { data: patientsALL } = await useAsyncData<Patient[]>('patients-items', async () => {
    const { data } = await supabase.from('patients').select("id, nom, prenom, postnom")
    return (data || []) as unknown as Patient[]
})

const items = computed<SelectMenuItem[]>(() => orga.value?.map(lookup => ({
    label: lookup?.nom,
    id: String(lookup?.id)
})) || [])

const itemsPatients = computed<SelectMenuItem[]>(() => patientsALL.value?.map(lookup => ({
    label: lookup?.nom + ' ' + lookup?.postnom + ' ' + lookup?.prenom,
    id: String(lookup?.id)
})) || [])

const maxDate = new CalendarDate(new Date().getFullYear(), new Date().getMonth(), new Date().getDate())
const toCalendarDate = (date: Date) => {
    return new CalendarDate(
        date.getFullYear(),
        date.getMonth() + 1,
        date.getDate()
    )
}

async function onSubmit(event: FormSubmitEvent<Schema>) {
    const { data, error } = await supabase
        .from('patients_organisations')
        .insert(event?.data as any)
        .select()

    if (error) {
        toast.add({ title: 'Error', description: `Can't add new patient ${error.message}`, color: 'error' })
    } else {
        toast.add({ title: 'Success', description: `New patient attached to this organisation`, color: 'success' })
        open.value = false
        emit('patient-added')
    }
}

function onError(error: FormErrorEvent) {
    toast.add({ title: 'Error', description: error.errors[0]?.message, color: 'error' })
}
</script>

<template>
    <UModal v-model:open="open" title="Attacher un patient" description="Attacher un patient à cette entreprise">
        <UButton label="Attacher un nouveau patient" icon="material-symbols:deployed-code-account-rounded" />

        <template #body>
            <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit" @error="onError">
                <UFormField label="Organisation" name="organisation_id">
                    <USelectMenu v-model="state.organisation_id" value-key="id" :items="items" class="w-full"
                                 disabled />
                </UFormField>
                <UFormField label="Patient" name="patient_id">
                    <USelectMenu v-model="state.patient_id" value-key="id" :items="itemsPatients" class="w-full" />
                </UFormField>
                <UFormField label="Date de debut" placeholder="08/12/2025" name="date_debut">
                    <UInputDate v-model="dateDebutModel" class="w-full" :max-date="maxDate">
                        <template #trailing>
                            <UPopover :reference="inputDateDebutRef?.inputsRef[3]?.$el">
                                <UButton color="neutral" variant="link" size="sm" icon="i-lucide-calendar"
                                         aria-label="Select a date" class="px-0" />

                                <template #content>
                                    <UCalendar v-model="dateDebutModel" class="p-2" :max-date="maxDate" />
                                </template>
                            </UPopover>
                        </template>
                    </UInputDate>
                </UFormField>
                <div class="flex justify-end gap-2">
                    <UButton label="Annuler" color="neutral" variant="subtle" @click="open = false" />
                    <UButton label="Attacher" icon="ri:link-unlink" color="primary" variant="solid" type="submit" />
                </div>
            </UForm>
        </template>
    </UModal>
</template>
