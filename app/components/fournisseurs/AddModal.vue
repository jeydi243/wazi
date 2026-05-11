<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent, SelectMenuItem } from '@nuxt/ui'
import type { Article, Lookup } from '~/types'

const ArticleSchema = z.object({
    code: z.string().min(6, 'Code must be at least 6 characters'),
    nom: z.string().min(6, 'Name must be at least 6 characters'),
    description: z.string().min(5, 'Description must be at least 5 characters'),
    type_id: z.string().optional()
})
const supabase = useSupabaseClient()
const open = ref(false)
const toast = useToast()
type Schema = z.output<typeof ArticleSchema>

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

const { data: lookups } = await useAsyncData<Lookup[]>('lookups-fournisseurs', async () => {
    const { data } = await supabase.from('lookups').select('id, nom, classes!inner(*)').eq('classes.table_name', 'TYPE_ARTICLES')
    return (data || []) as unknown as Lookup[]
})

const items = computed<SelectMenuItem[]>(() => lookups.value?.map(lookup => ({
    label: lookup?.nom,
    id: String(lookup?.id)
})) || [])

const emit = defineEmits(['fournisseur-added'])

async function onSubmit(event: FormSubmitEvent<Schema>) {
    const { data, error } = await supabase
        .from('fournisseurs')
        .insert(event?.data as any)
        .select()

    if (error) {
        toast.add({ title: 'Error', description: `Can't add new fournisseur ${error.message}`, color: 'error' })
    } else {
        toast.add({ title: 'Success', description: `New fournisseur ${event.data.nom} added`, color: 'success' })
        open.value = false
        emit('fournisseur-added')
        // Réinitialiser le code après soumission réussie
        state.code = generateRandomCode()
    }
}
</script>

<template>
    <UModal v-model:open="open" title="Ajouter un fournisseur" description="Ajouter un fournisseur">
        <UButton label="Ajouter un fournisseur" icon="i-lucide-plus" />

        <template #body>
            <UForm :schema="ArticleSchema" :state="state" class="space-y-4" @submit="onSubmit">
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
                    <UButton label="Ajouter un fournisseur" color="primary" variant="solid" type="submit" />
                </div>
            </UForm>
        </template>
    </UModal>
</template>
