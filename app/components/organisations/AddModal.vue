<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent, SelectMenuItem } from '@nuxt/ui'
import type { Lookup } from '~/types'

const schema = z.object({
    nom: z.string().min(3, 'Too short'),
    description: z.string(),
    code: z.string(),
    lookup_id: z.string(),
})
const open = ref(false)
const toast = useToast()
type Schema = z.output<typeof schema>
const supabase = useSupabaseClient()
const state = reactive<Partial<Schema>>({
    nom: undefined,
    description: undefined,
    code: undefined,
    lookup_id: undefined,
})
const { data: lookups } = await useAsyncData('lookups', async () => {
    const { data } = await supabase.from('lookups').select('id, nom')
    return data
})
const typeOrganisation = useParametresStore().getTypeOrganisation
const items = computed<SelectMenuItem[]>(() => typeOrganisation?.map((lookup: Lookup) => ({
    label: lookup.nom,
    id: lookup.id
})) || [])

const emit = defineEmits(['organisation-added'])

async function onSubmit(event: FormSubmitEvent<Schema>) {
    const { data, error } = await supabase
        .from('organisations')
        .insert([{
            nom: event.data.nom,
            description: event.data.description,
            code: event.data.code,
            lookup_id: event.data.lookup_id
        }] as never)
        .select()

    if (error) {
        toast.add({ title: 'Error', description: `Can't add new organisation ${error.message}`, color: 'error' })
    } else {
        toast.add({ title: 'Success', description: `New organisation ${event.data.nom} added`, color: 'success' })
        emit('organisation-added')
        open.value = false
    }
}
</script>


<template>
    <UModal v-model:open="open" title="Organisation" description="Add a new organisation to the database">
        <UButton label="New organisation" icon="i-lucide-plus" />

        <template #body>
            <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
                <UFormField label="Type d'organisation" placeholder="_" name="lookup_id">
                    <USelectMenu v-model="state.lookup_id" value-key="id" :items="items" class="w-full" />
                </UFormField>
                <UFormField label="Code" placeholder="Code d'organisation" name="code">
                    <UInput v-model="state.code" class="w-full" />
                </UFormField>
                <UFormField label="Name" placeholder="John Doe" name="nom">
                    <UInput v-model="state.nom" class="w-full" />
                </UFormField>
                <UFormField label="Description" placeholder="" name="description">
                    <UTextarea v-model="state.description" class="w-full" />
                </UFormField>
                <div class="flex justify-end gap-2">
                    <UButton label="Cancel" color="neutral" variant="subtle" @click="open = false" />
                    <UButton label="Add" color="primary" variant="solid" type="submit" />
                </div>
            </UForm>
        </template>
    </UModal>
</template>
