<script setup lang="ts">
import * as z from 'zod'
import type { FormError, FormErrorEvent, FormSubmitEvent } from '@nuxt/ui'
import { CalendarDate, getLocalTimeZone } from '@internationalized/date'

const schema = z.object({
    nom: z.string().min(2, 'Too short'),
    prenom: z.string(),
    postnom: z.string(),
    sexe: z.string(),
    date_naissance: z.date().max(new Date(), 'Date de naissance must be in the past')
})
const toast = useToast()
const open = ref(false)
const emit = defineEmits(['patient-added'])
const supabase = useSupabaseClient()
type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
    nom: undefined,
    prenom: undefined,
    postnom: undefined,
    sexe: undefined,
    date_naissance: undefined
})
const inputDateRef = useTemplateRef('inputDateRef')
const itemsGenre = [
    { value: 'M', label: 'Masculin' },
    { value: 'F', label: 'Feminin' }
]

const maxDate = new CalendarDate(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate())
const toCalendarDate = (date: Date) => {
    return new CalendarDate(
        date.getFullYear(),
        date.getMonth() + 1,
        date.getDate()
    )
}

const dateNaissanceModel = computed({
    get: () => state.date_naissance ? toCalendarDate(state.date_naissance) : undefined,
    set: (value: CalendarDate | null) => {
        state.date_naissance = value ? value.toDate(getLocalTimeZone()) : undefined
    }
})

async function onSubmit(event: FormSubmitEvent<Schema>) {
    const { data, error } = await supabase
        .from('patients')
        .insert(event?.data as any)
        .select()

    if (error) {
        toast.add({ title: 'Error', description: `Can't add new patient ${error.message}`, color: 'error' })
    } else {
        toast.add({ title: 'Success', description: `New patient ${event.data.nom} ${event.data.prenom} ${event.data.postnom} added`, color: 'success' })
        open.value = false
        emit('patient-added')
    }
}

function onError(error: FormErrorEvent) {
    toast.add({ title: 'Error', description: error.errors[0]?.message, color: 'error' })
}
</script>

<template>
    <UModal v-model:open="open" title="New patient" description="Add a new patient to the database">
        <UButton label="Nouveau patient" icon="i-lucide-plus" />

        <template #body>
            <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit" @error="onError">
                <UFormField label="Nom" placeholder="John Doe" name="nom">
                    <UInput v-model="state.nom" class="w-full" />
                </UFormField>
                <UFormField label="Postnom" placeholder="john.doe@example.com" name="postnom">
                    <UInput v-model="state.postnom" class="w-full" />
                </UFormField>
                <UFormField label="Prenom" placeholder="john.doe@example.com" name="prenom">
                    <UInput v-model="state.prenom" class="w-full" />
                </UFormField>
                <UFormField label="Genre" placeholder="Masculin ou Feminin" name="sexe">
                    <USelect v-model="state.sexe" class="w-full" :items="itemsGenre" />
                </UFormField>
                <UFormField label="Date de naissance" placeholder="08/12/2025" name="date_naissance">
                    <UInputDate v-model="dateNaissanceModel" class="w-full" :max-date="maxDate" >
                        <template #trailing>
                            <UPopover :reference="inputDateRef?.inputsRef[3]?.$el">
                                <UButton color="neutral" variant="link" size="sm" icon="i-lucide-calendar" aria-label="Select a date"
                                         class="px-0" />

                                <template #content>
                                    <UCalendar v-model="dateNaissanceModel" class="p-2" :max-date="maxDate" />
                                </template>
                            </UPopover>
                        </template>
                    </UInputDate>
                </UFormField>
                <div class="flex justify-end gap-2">
                    <UButton label="Annuler" color="neutral" variant="subtle" @click="open = false" />
                    <UButton label="Ajouter" icon="i-lucide-plus" color="primary" variant="solid" type="submit" />
                </div>
            </UForm>
        </template>
    </UModal>
</template>
