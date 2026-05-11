<script setup lang="ts">
import * as z from 'zod'
import type { FormErrorEvent, FormSubmitEvent, SelectMenuItem } from '@nuxt/ui'
import { CalendarDate, getLocalTimeZone } from '@internationalized/date'
import type { Lookup } from '~/types'

const schema = z.object({
    nom: z.string().min(2, 'Too short'),
    description: z.string(),
    lookup_id: z.string().min(2, 'Too short'),
})
const toast = useToast()
const open = ref(false)
const emit = defineEmits(['partenaire-added'])
const supabase = useSupabaseClient()
type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
    nom: undefined,
    description: undefined,
    lookup_id: undefined
})

const { data: lookups } = await useAsyncData<Lookup[]>('lookups-org', async () => {
    const { data } = await supabase.from('lookups').select('id, nom, description').eq('nom', 'Entreprise')
    return (data || []) as unknown as Lookup[]
})

const items = computed<SelectMenuItem[]>(() => lookups.value?.map(lookup => ({
    label: lookup?.nom,
    id: String(lookup?.id)
})) || [])

const maxDate = new CalendarDate(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate())
const toCalendarDate = (date: Date) => {
    return new CalendarDate(
        date.getFullYear(),
        date.getMonth() + 1,
        date.getDate()
    )
}

async function onSubmit(event: FormSubmitEvent<Schema>) {
    const { data, error } = await supabase
        .from('organisations')
        .insert(event?.data as any)
        .select()

    if (error) {
        toast.add({ title: 'Error', description: `Can't add new partenaire ${error.message}`, color: 'error' })
    } else {
        toast.add({ title: 'Success', description: `New partenaire ${event.data.nom} added`, color: 'success' })
        open.value = false
        emit('partenaire-added')
    }
}

function onError(error: FormErrorEvent) {
    toast.add({ title: 'Error', description: error.errors[0]?.message, color: 'error' })
}
</script>

<template>
    <UModal v-model:open="open" title="Nouvelle mutuelle" description="Ajouter une nouvelle mutuelle">
        <UButton label="Nouvelle mutuelle" icon="i-lucide-plus" />

        <template #body>
            <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit" @error="onError">
                <UFormField label="Nom" placeholder="John Doe" name="nom">
                    <UInput v-model="state.nom" class="w-full" />
                </UFormField>
                <UFormField label="Description" placeholder="Description de l'entreprise" name="description">
                    <UTextarea v-model="state.description" class="w-full" />
                </UFormField>
                <UFormField label="Type d'organisation" name="lookup_id">
                    <USelectMenu v-model="state.lookup_id" value-key="id" :items="items" class="w-full" />
                </UFormField>
                <div class="flex justify-end gap-2">
                    <UButton label="Annuler" color="neutral" variant="subtle" @click="open = false" />
                    <UButton label="Ajouter" icon="i-lucide-plus" color="primary" variant="solid" type="submit" />
                </div>
            </UForm>
        </template>
    </UModal>
</template>
