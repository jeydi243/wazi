<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent, SelectMenuItem } from '@nuxt/ui'
import type { Lookup } from '~/types'

const schema = z.object({
    nom: z.string().min(3, 'Too short'),
    description: z.string(),
    code: z.string(),
    type_id: z.string(),
    nid: z.string().optional(),
})
const open = ref(false)
const toast = useToast()
type Schema = z.output<typeof schema>
const supabase = useSupabaseClient()
const parametresStore = useParametresStore()
const state = reactive<Partial<Schema>>({
    nom: undefined,
    description: undefined,
    code: undefined,
    type_id: undefined,
    nid: undefined
})
const getTypeOrganisations = computed(() => parametresStore.getTypeOrganisations)
const itemsOrganisation = computed<SelectMenuItem[]>(() => getTypeOrganisations.value?.map((org: any) => ({
    label: org.nom,
    id: org.id
})) || [])

const emit = defineEmits(['point-facturation-added'])

async function onSubmit(event: FormSubmitEvent<Schema>) {
    const { data, error } = await supabase
        .from('organisations')
        .insert([{
            nom: event.data.nom,
            description: event.data.description,
            code: event.data.code,
            type_id: event.data.type_id,
            nid: event.data.nid
        }] as never)
        .select()

    if (error) {
        toast.add({ title: 'Error', description: `Can't add new point-facturation ${error.message}`, color: 'error' })
    } else {
        toast.add({ title: 'Success', description: `New point-facturation ${event.data.nom} added`, color: 'success' })
        emit('point-facturation-added')
        open.value = false
    }
}
</script>


<template>
    <UModal v-model:open="open" title="Point de facturation" description="Ajouter un nouveau point de facturation">
        <UButton label="Nouveau point de facturation" icon="i-lucide-plus" />

        <template #body>
            <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
                <UFormField label="Type d'organisation" name="type_id">
                    <USelectMenu v-model="state.type_id" value-key="id" :items="itemsOrganisation" class="w-full" />
                </UFormField>
                <UFormField label="Code" name="code">
                    <UInput v-model="state.code" class="w-full" />
                </UFormField>
                <UFormField label="Nom" name="nom">
                    <UInput v-model="state.nom" class="w-full" />
                </UFormField>
                <UFormField label="Description" name="description">
                    <UTextarea v-model="state.description" class="w-full" />
                </UFormField>
                <div class="flex justify-end gap-2">
                    <UButton label="Cancel" color="neutral" variant="subtle" @click="open = false" />
                    <UButton label="Ajouter" color="primary" variant="solid" type="submit" />
                </div>
            </UForm>
        </template>
    </UModal>
</template>
