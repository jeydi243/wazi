<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent, SelectMenuItem } from '@nuxt/ui'
import type { Article, Lookup } from '~/types'

const ArticleSchema = z.object({
    type_article_id: z.string().min(6, 'Code must be at least 6 characters'),
    code: z.string().min(6, 'Code must be at least 6 characters'),
    nom: z.string().min(6, 'Name must be at least 6 characters'),
    description: z.string().min(5, 'Description must be at least 5 characters'),
    lookup_id: z.string().optional(),
    unite_conso_id: z.string().optional(),
    unite_stock_id: z.string().optional()
})
const supabase = useSupabaseClient()
const open = ref(false)
const toast = useToast()
const articlesStore = useArticlesStore()
type Schema = z.output<typeof ArticleSchema>
const parametresStore = useParametresStore()
const state = reactive<Partial<Schema>>({
    code: undefined,
    nom: undefined,
    description: undefined,
    lookup_id: undefined,
    type_article_id: undefined,
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

const getTypeArticle = computed(() => parametresStore.getTypeArticles)

const itemsTypeArticle = computed<SelectMenuItem[]>(() => getTypeArticle.value?.map((item: any) => ({
    label: item.nom,
    id: item.id
})) || [])
const emit = defineEmits(['article-added'])

async function onSubmit(event: FormSubmitEvent<Schema>) {
    try {
        await articlesStore.create(event?.data as any)
        toast.add({ title: 'Success', description: `Nouvel article ${event.data.nom} ajouté`, color: 'success' })
        open.value = false
        emit('article-added')
    } catch (err: any) {
        toast.add({ title: 'Erreur', description: `Impossible d'ajouter l'article : ${err.message}`, color: 'error' })
    }
}
</script>

<template>
    <UModal v-model:open="open" title="Ajouter Article" description="Ajouter un article">
        <UButton label="Add article" icon="i-lucide-plus" />

        <template #body>
            <UForm :schema="ArticleSchema" :state="state" class="space-y-4" @submit="onSubmit">
                <UFormField label="Type d'article" name="type_article_id">
                    <USelectMenu v-model="state.type_article_id" value-key="id" :items="itemsTypeArticle"
                        class="w-full" />
                </UFormField>
                <UFormField label="Code" name="code">
                    <UInput v-model="state.code" class="w-full" placeholder="Code de l'article" />
                </UFormField>
                <UFormField label="Nom" name="nom">
                    <UInput v-model="state.nom" class="w-full" placeholder="Nom de l'article" />
                </UFormField>

                <UFormField label="Description" name="description">
                    <UTextarea v-model="state.description" class="w-full" placeholder="Description de l'article" />
                </UFormField>

                <UFormField label="Catégorie d'article" name="lookup_id">
                    <USelectMenu v-model="state.lookup_id" value-key="id" :items="items" class="w-full" />
                </UFormField>
                <div class="flex flex-row space-x-4">
                    <UFormField label="Unite de consommation" name="unite_conso_id">
                        <USelectMenu v-model="state.unite_conso_id" value-key="id" :items="itemsUOM" class="w-full" />
                    </UFormField>
                    <UFormField label="Unite de stock" name="unite_stock_id">
                        <USelectMenu v-model="state.unite_stock_id" value-key="id" :items="itemsUOM" class="w-full" />
                    </UFormField>
                </div>

                <div class="flex justify-end gap-2">
                    <UButton label="Annuler" color="neutral" variant="subtle" @click="open = false" />
                    <UButton label="Ajouter un article" color="primary" variant="solid" type="submit" />
                </div>
            </UForm>
        </template>
    </UModal>
</template>
