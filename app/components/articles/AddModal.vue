<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent, SelectMenuItem } from '@nuxt/ui'
import type { Article, Lookup } from '~/types'

const ArticleSchema = z.object({
    code: z.string().min(6, 'Code must be at least 6 characters'),
    nom: z.string().min(6, 'Name must be at least 6 characters'),
    description: z.string().min(5, 'Description must be at least 5 characters'),
    lookup_id: z.string(),
    unite_conso_id: z.string(),
    unite_stock_id: z.string()
})
const supabase = useSupabaseClient()
const open = ref(false)
const toast = useToast()
type Schema = z.output<typeof ArticleSchema>

const state = reactive<Partial<Schema>>({
    code: undefined,
    nom: undefined,
    description: undefined,
    lookup_id: undefined,
})
const { data: lookups } = await useAsyncData<Lookup[]>('lookups-articles', async () => {
    const { data } = await supabase.from('lookups').select('id, nom, classes!inner(*)').eq('classes.table_name', 'TYPE_ARTICLES')
    return (data || []) as unknown as Lookup[]
})

const items = computed<SelectMenuItem[]>(() => lookups.value?.map(lookup => ({
    label: lookup?.nom,
    id: String(lookup?.id)
})) || [])

const itemsUOM = computed<SelectMenuItem[]>(() => lookups.value?.map(lookup => ({
    label: lookup?.nom,
    id: String(lookup?.id)
})) || [])

const emit = defineEmits(['article-added'])

async function onSubmit(event: FormSubmitEvent<Schema>) {
    const { data, error } = await supabase
        .from('articles')
        .insert(event?.data as any)
        .select()

    if (error) {
        toast.add({ title: 'Error', description: `Can't add new article ${error.message}`, color: 'error' })
    } else {
        toast.add({ title: 'Success', description: `New article ${event.data.nom} added`, color: 'success' })
        open.value = false
        emit('article-added')
    }
}
</script>

<template>
    <UModal v-model:open="open" title="Ajouter Article" description="Ajouter un article">
        <UButton label="Add article" icon="i-lucide-plus" />

        <template #body>
            <UForm :schema="ArticleSchema" :state="state" class="space-y-4" @submit="onSubmit">
                <UFormField label="Code" name="code">
                    <UInput v-model="state.code" class="w-full" placeholder="Code de l'article" />
                </UFormField>
                <UFormField label="Nom" name="nom">
                    <UInput v-model="state.nom" class="w-full" placeholder="Nom de l'article" />
                </UFormField>

                <UFormField label="Description" name="description">
                    <UTextarea v-model="state.description" class="w-full" placeholder="Description de l'article" />
                </UFormField>

                <UFormField label="Type d'article" name="lookup_id">
                    <USelectMenu v-model="state.lookup_id" value-key="id" :items="items" class="w-full" />
                </UFormField>
                <UFormField label="Unite de consommation" name="unite_conso_id">
                    <USelectMenu v-model="state.unite_conso_id" value-key="id" :items="itemsUOM" class="w-full" />
                </UFormField>
                <UFormField label="Unite de stock" name="unite_stock_id">
                    <USelectMenu v-model="state.unite_stock_id" value-key="id" :items="itemsUOM" class="w-full" />
                </UFormField>

                <div class="flex justify-end gap-2">
                    <UButton label="Annuler" color="neutral" variant="subtle" @click="open = false" />
                    <UButton label="Ajouter un article" color="primary" variant="solid" type="submit" />
                </div>
            </UForm>
        </template>
    </UModal>
</template>
