<script setup lang="ts">
import * as z from 'zod'
import type { FormErrorEvent, FormSubmitEvent } from '@nuxt/ui'
import { CalendarDate, getLocalTimeZone } from '@internationalized/date'
import type { Patient } from '~/types'

const schema = z.object({
    nom: z.string().min(2, 'Trop court'),
    prenom: z.string(),
    postnom: z.string().optional(),
    sexe: z.string().optional(),
    date_naissance: z.date().optional()
})
type Schema = z.output<typeof schema>

const props = defineProps({
    open: { type: Boolean, required: true },
    patient: { type: Object as PropType<Patient | null>, required: true }
})
const emit = defineEmits(['update:open', 'patient-updated'])

// Pattern computed pour modifier props.open
const isOpen = computed({
    get: () => props.open,
    set: (value) => emit('update:open', value)
})

const toast = useToast()
const supabase = useSupabaseClient()

const state = reactive<Partial<Schema>>({
    nom: undefined,
    prenom: undefined,
    postnom: undefined,
    sexe: undefined,
    date_naissance: undefined
})

const itemsGenre = [
    { value: 'M', label: 'Masculin' },
    { value: 'F', label: 'Féminin' }
]

const maxDate = new CalendarDate(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate())
const toCalendarDate = (date: Date) => {
    return new CalendarDate(date.getFullYear(), date.getMonth() + 1, date.getDate())
}

const dateNaissanceModel = computed({
    get: () => state.date_naissance ? toCalendarDate(state.date_naissance) : undefined,
    set: (value: CalendarDate | null) => {
        state.date_naissance = value ? value.toDate(getLocalTimeZone()) : undefined
    }
})

// Remplir le state quand la modale s'ouvre
watch(() => props.open, (newVal) => {
    if (newVal && props.patient) {
        state.nom = props.patient.nom
        state.prenom = props.patient.prenom
        state.postnom = props.patient.postnom
        state.sexe = props.patient.sexe
        if (props.patient.date_naissance) {
            state.date_naissance = new Date(props.patient.date_naissance)
        }
    }
}, { immediate: true })

async function onSubmit(event: FormSubmitEvent<Schema>) {
    if (!props.patient?.id) return

    const { error } = await supabase
        .from('patients')
        .update(event.data)
        .eq('id', props.patient.id)

    if (error) {
        toast.add({ title: 'Erreur', description: error.message, color: 'error' })
    } else {
        toast.add({ title: 'Succès', description: 'Informations mises à jour.', color: 'success' })
        isOpen.value = false
        emit('patient-updated')
    }
}

function onError(error: FormErrorEvent) {
    toast.add({ title: 'Erreur', description: error.errors[0]?.message || 'Formulaire invalide', color: 'error' })
}
</script>

<template>
    <UModal v-model:open="isOpen" title="Modifier le patient" description="Mettre à jour l'identité de ce patient">
        <template #body>
            <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit" @error="onError">
                <UFormField label="Nom" name="nom">
                    <UInput v-model="state.nom" class="w-full" />
                </UFormField>
                <UFormField label="Prénom" name="prenom">
                    <UInput v-model="state.prenom" class="w-full" />
                </UFormField>
                <UFormField label="Postnom" name="postnom">
                    <UInput v-model="state.postnom" class="w-full" />
                </UFormField>
                <UFormField label="Sexe" name="sexe">
                    <USelect v-model="state.sexe" class="w-full" :items="itemsGenre" />
                </UFormField>
                <UFormField label="Date de naissance" name="date_naissance">
                    <UInputDate v-model="dateNaissanceModel" class="w-full" :max-date="maxDate">
                        <template #trailing>
                            <UPopover>
                                <UButton color="neutral" variant="link" size="sm" icon="i-lucide-calendar"
                                         class="px-0" />
                                <template #content>
                                    <UCalendar v-model="dateNaissanceModel" class="p-2" :max-date="maxDate" />
                                </template>
                            </UPopover>
                        </template>
                    </UInputDate>
                </UFormField>
                <div class="flex justify-end gap-2 mt-6">
                    <UButton label="Annuler" color="neutral" variant="subtle" @click="isOpen = false" />
                    <UButton label="Enregistrer" icon="i-lucide-save" color="primary" variant="solid" type="submit" />
                </div>
            </UForm>
        </template>
    </UModal>
</template>
