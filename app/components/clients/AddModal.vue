<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent, SelectMenuItem } from '@nuxt/ui'
import type { Client, Lookup } from '~/types'

const ClientSchema = z.object({
    code: z.string().min(6, 'Code must be at least 6 characters'),
    nom: z.string().min(6, 'Name must be at least 6 characters'),
    description: z.string().min(5, 'Description must be at least 5 characters'),
    type_id: z.string().optional()
})
const supabase = useSupabaseClient()
const open = ref(false)
const toast = useToast()
type Schema = z.output<typeof ClientSchema>

const state = reactive<Partial<Schema>>({
    code: generateRandomCode(),
    nom: undefined,
    description: undefined,
    type_id: undefined,
})

function generateRandomCode(length = 6) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length))
    }
    return result
}

const { data: lookups } = await useAsyncData<Client[]>('clients-type', async () => {
    const { data } = await supabase.from('lookups').select('*').eq('classes.table_name', 'TYPE_CLIENTS')
    return (data || []) as unknown as Client[]
})

const items = computed<SelectMenuItem[]>(() => lookups.value?.map(lookup => ({
    label: lookup?.nom,
    id: String(lookup?.id)
})) || [])

const emit = defineEmits(['client-added'])

async function onSubmit(event: FormSubmitEvent<Schema>) {
    const { data, error } = await supabase
        .from('clients')
        .insert(event?.data as any)
        .select()

    if (error) {
        toast.add({ title: 'Error', description: `Can't add new client ${error.message}`, color: 'error' })
    } else {
        toast.add({ title: 'Success', description: `New client ${event.data.nom} added`, color: 'success' })
        open.value = false
        emit('client-added')
        // Réinitialiser le code après soumission réussie
        state.code = generateRandomCode()
    }
}
</script>

<template>
    <UModal v-model:open="open" title="Ajouter un client" description="Ajouter un client">
        <UButton label="Ajouter un client" icon="i-lucide-plus" />

        <template #body>
            <UForm :schema="ClientSchema" :state="state" class="space-y-4" @submit="onSubmit">
                <UFormField label="Code" name="code">
                    <UInput v-model="state.code" class="w-full" placeholder="Code de l'article">
                        <template #trailing>
                            <UButton icon="i-lucide-refresh-cw" color="neutral" variant="ghost" size="xs"
                                     @click="state.code = generateRandomCode()" />
                        </template>
                    </UInput>
                </UFormField>
                <UFormField label="Nom" name="nom">
                    <UInput v-model="state.nom" class="w-full" placeholder="Nom de l'article" />
                </UFormField>

                <UFormField label="Description" name="description">
                    <UTextarea v-model="state.description" class="w-full" placeholder="Description de l'article" />
                </UFormField>

                <div class="flex justify-end gap-2">
                    <UButton label="Annuler" color="neutral" variant="subtle" @click="open = false" />
                    <UButton label="Ajouter un client" color="primary" variant="solid" type="submit" />
                </div>
            </UForm>
        </template>
    </UModal>
</template>
