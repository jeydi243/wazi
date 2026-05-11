<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

const schema = z.object({
    nom: z.string().min(3, 'Too short'),
    description: z.string(),
    table_name: z.string(),
})
const open = ref(false)
const toast = useToast()
type Schema = z.output<typeof schema>
const supabase = useSupabaseClient<any>()
const state = reactive<Partial<Schema>>({
    nom: undefined,
    description: undefined,
    table_name: undefined,
})


async function onSubmit(event: FormSubmitEvent<Schema>) {
    const { data, error } = await supabase
        .from('classes')
        .insert(event.data)
        .select()

    if (error) {
        toast.add({ title: 'Error', description: `Can't add new classe ${error.message}`, color: 'error' })
    } else {
        toast.add({ title: 'Success', description: `New classe ${event.data.nom} added`, color: 'success' })
        open.value = false
    }
}
</script>

<template>
    <UModal v-model:open="open" title="Classe" description="Add a new classe to the database">
        <UButton label="New classe" icon="i-lucide-plus" />

        <template #body>
            <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
                <UFormField label="Nom" placeholder="John Doe" name="nom">
                    <UInput v-model="state.nom" class="w-full" />
                </UFormField>
                <UFormField label="Description" placeholder="" name="description">
                    <UInput v-model="state.description" class="w-full" />
                </UFormField>
                <UFormField label="Table name" placeholder="_" name="table_name">
                    <UInput v-model="state.table_name" class="w-full" />
                </UFormField>
                <div class="flex justify-end gap-2">
                    <UButton label="Annuler" color="neutral" variant="subtle" @click="open = false" />
                    <UButton label="Créer" color="primary" variant="solid" type="submit" />
                </div>
            </UForm>
        </template>
    </UModal>
</template>
