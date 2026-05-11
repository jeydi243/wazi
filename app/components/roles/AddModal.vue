<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent, SelectMenuItem } from '@nuxt/ui'
import type { Role, Lookup } from '~/types'

const RoleSchema = z.object({
    code: z.string().min(3, 'Code must be at least 6 characters'),
    nom: z.string().min(6, 'Name must be at least 6 characters'),
    description: z.string().min(5, 'Description must be at least 5 characters'),
    entite: z.string().optional()
})
const supabase = useSupabaseClient()
const open = ref(false)
const toast = useToast()
type Schema = z.output<typeof RoleSchema>

const state = reactive<Partial<Schema>>({
    code: undefined,
    nom: undefined,
    description: undefined,
    entite: undefined,
})
const { data: lookups } = await useAsyncData<Lookup[]>('lookups-roles', async () => {
    const { data } = await supabase.from('lookups').select('id, nom, classes!inner(*)').eq('classes.table_name', 'TYPE_ARTICLES')
    return (data || []) as unknown as Lookup[]
})

const items = computed<SelectMenuItem[]>(() => lookups.value?.map(lookup => ({
    label: lookup?.nom,
    id: String(lookup?.id)
})) || [])

const emit = defineEmits(['role-added'])

async function onSubmit(event: FormSubmitEvent<Schema>) {
    const { data, error } = await supabase
        .from('roles')
        .insert(event?.data as any)
        .select()

    if (error) {
        toast.add({ title: 'Error', description: `Can't add new role ${error.message}`, color: 'error' })
    } else {
        toast.add({ title: 'Success', description: `New role ${event.data.nom} added`, color: 'success' })
        open.value = false
        emit('role-added')
    }
}
</script>

<template>
    <UModal v-model:open="open" title="Rôle" description="Ajouter un rôle ">
        <UButton label="Ajouter un rôle" icon="i-lucide-plus" />

        <template #body>
            <UForm :schema="RoleSchema" :state="state" class="space-y-4" @submit="onSubmit">
                <UFormField label="Code" name="code">
                    <UInput v-model="state.code" class="w-full" />
                </UFormField>
                <UFormField label="Nom" name="nom">
                    <UInput v-model="state.nom" class="w-full" />
                </UFormField>

                <UFormField label="Description" name="description">
                    <UTextarea v-model="state.description" class="w-full" />
                </UFormField>

                <UFormField label="Entité" name="entite">
                    <USelectMenu v-model="state.entite" value-key="id" :items="items" class="w-full" />
                </UFormField>

                <div class="flex justify-end gap-2">
                    <UButton label="Annuler" color="neutral" variant="subtle" @click="open = false" />
                    <UButton label="Ajouter un rôle" color="primary" variant="solid" type="submit" />
                </div>
            </UForm>
        </template>
    </UModal>
</template>
