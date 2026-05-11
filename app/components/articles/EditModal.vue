<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent, SelectMenuItem } from '@nuxt/ui'
import type { Article, Lookup } from '~/types'

const props = defineProps<{
    article: Article | null
}>()

const open = defineModel<boolean>('open', { default: false })

const ArticleSchema = z.object({
    code: z.string().min(6, 'Code must be at least 6 characters'),
    nom: z.string().min(6, 'Name must be at least 6 characters'),
    description: z.string().min(5, 'Description must be at least 5 characters'),
    lookup_id: z.string(),
    unite_conso_id: z.string(),
    unite_stock_id: z.string()
})

const supabase = useSupabaseClient()
const toast = useToast()
type Schema = z.output<typeof ArticleSchema>

const state = reactive<Partial<Schema>>({
    code: undefined,
    nom: undefined,
    description: undefined,
    lookup_id: undefined,
    unite_conso_id: undefined,
    unite_stock_id: undefined
})

// Update state when article changes
watch(() => props.article, (newArticle) => {
    if (newArticle) {
        state.code = newArticle.code
        state.nom = newArticle.nom
        state.description = newArticle.description
        state.lookup_id = (newArticle.lookup as any)?.id // Usually joined as lookup object
        state.unite_conso_id = (newArticle.unite_conso as any)?.id
        state.unite_stock_id = (newArticle.unite_stock as any)?.id
    }
}, { immediate: true })

const { data: lookups } = await useAsyncData<Lookup[]>('lookups-articles-edit', async () => {
    const { data } = await supabase.from('lookups').select('id, nom, classes!inner(*)').eq('classes.table_name', 'TYPE_ARTICLES')
    return (data || []) as unknown as Lookup[]
})
const { data: lookupsUOM } = await useAsyncData<Lookup[]>('lookups-articles-uom', async () => {
    const { data } = await supabase.from('lookups').select('id, nom, classes!inner(*)').eq('classes.table_name', 'CATEGORIE_UOM')
    return (data || []) as unknown as Lookup[]
})

const items = computed<SelectMenuItem[]>(() => lookups.value?.map(lookup => ({
    label: lookup?.nom,
    id: String(lookup?.id)
})) || [])

const itemsUOM = computed<SelectMenuItem[]>(() => lookupsUOM.value?.map(lookup => ({
    label: lookup?.nom,
    id: String(lookup?.id)
})) || [])

const emit = defineEmits(['article-updated'])

async function onSubmit(event: FormSubmitEvent<Schema>) {
    if (!props.article?.id) return

    const { data, error } = await supabase
        .from('articles')
        .update(event?.data as never)
        .eq('id', props.article.id)
        .select()

    if (error) {
        toast.add({ title: 'Error', description: `Impossible de modifier l'article: ${error.message}`, color: 'error' })
    } else {
        toast.add({ title: 'Success', description: `Article ${event.data.nom} modifié`, color: 'success' })
        open.value = false
        emit('article-updated')
    }
}
</script>

<template>
    <UModal v-model:open="open" title="Modifier Article" description="Modifier les informations de l'article">
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
                    <UButton label="Enregistrer" color="primary" variant="solid" type="submit" />
                </div>
            </UForm>
        </template>
    </UModal>
</template>
