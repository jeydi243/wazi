<template>
    <UModal v-model:open="open" description="Ajouter une article au tarifaire" :title="`Ajouter une article au tarifaire`" :dismissible="true">
        <UButton icon="i-lucide-plus" label="Ajouter une article" color="primary" variant="solid" />

        <template #body>
            <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
                <UFormField label="Tarifaire" name="tarifaire_id">
                    <USelectMenu v-model="state.tarifaire_id" disabled value-key="id" :items="itemsTarifaires"
                                 class="w-full" />
                </UFormField>

                <UFormField label="Article" name="article_id">
                    <USelectMenu v-model="state.article_id" value-key="id" :items="itemsArticles" class="w-full" />
                </UFormField>

                <UFormField label="Prix" name="prix">
                    <UInputNumber v-model="state.prix" class="w-full" placeholder="18 000 (CDF)" orientation="vertical"/>
                </UFormField>

                <div class="flex justify-end gap-2">
                    <UButton label="Annuler" color="neutral" variant="subtle" @click="open = false" />
                    <UButton label="Ajouter l'article" icon="i-lucide-plus" color="primary" variant="solid" type="submit" />
                </div>
            </UForm>
        </template>
    </UModal>
</template>
<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent, SelectMenuItem } from '@nuxt/ui'
import type { Tarifaire, Article, Organisation } from '~/types'

const supabase = useSupabaseClient()
const schema = z.object({
    tarifaire_id: z.string(),
    article_id: z.string(),
    prix: z.number()
})

const { data: tarifaires } = await useAsyncData<Tarifaire[]>('add-article-tarifaires', async () => {
    const { data } = await supabase.from('tarifaires').select('id, nom, description')
    return data as any as Tarifaire[]
})
const { data: organisations } = await useAsyncData<Organisation[]>('organisations', async () => {
    const { data } = await supabase.from('organisations').select()
    return data as any as Organisation[]
})
const { data: articles } = await useAsyncData<Article[]>('add-article-articles', async () => {
    const { data } = await supabase.from('articles').select()
    return data as any as Article[]
})

const itemsTarifaires = computed<SelectMenuItem[]>(() => tarifaires.value?.map(tarifaire => ({
    label: tarifaire.nom,
    id: tarifaire.id
})) || [])

const itemsOrganisations = computed<SelectMenuItem[]>(() => organisations.value?.map(organisation => ({
    label: organisation.nom,
    id: organisation.id
})) || [])

const itemsArticles = computed<SelectMenuItem[]>(() => articles.value?.map(article => ({
    label: article.nom,
    id: article.id
})) || [])

const props = defineProps({
    tarifaire_id: {
        type: String as PropType<string | null>
    }
})

const open = ref(false)
const toast = useToast()
type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
    tarifaire_id: props.tarifaire_id || undefined,
    article_id: undefined,
    prix: undefined,
})
async function onSubmit(event: FormSubmitEvent<Schema>) {
    console.log(event?.data)
    console.log(props.tarifaire_id)
    const { data, error } = await supabase
        .from('tarifaires_lines')
        .insert(event?.data as any)
        .select()

    if (error) {
        toast.add({ title: 'Error', description: `Can't add new article ${error.message}`, color: 'error' })
    } else {
        toast.add({ title: 'Success', description: `New article added`, color: 'success' })
        open.value = false
        emit('article-added')
    }
}

const emit = defineEmits(['article-added'])
</script>