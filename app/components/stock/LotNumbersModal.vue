<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent, SelectMenuItem } from '@nuxt/ui'
import type { Article } from '~/types'

const props = defineProps<{
    open: boolean
    lineId?: string | null
    article?: Article | null
}>()
const emit = defineEmits(['update:open', 'line-added'])

const supabase = useSupabaseClient()
const toast = useToast()
const stockStore = useStockStore()

const isOpen = computed({
    get: () => props.open,
    set: (value) => emit('update:open', value)
})

const schema = z.object({
    article_id: z.string({ message: 'Veuillez sélectionner un article' }),
    quantite_trx: z.number().min(1, 'Quantité invalide'),
    prix: z.number().min(0, 'Prix invalide'),
})
type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
    article_id: undefined,
    quantite_trx: 1,
    prix: 0,
})

const { data: articles } = await useAsyncData('articles-select', async () => {
    const { data } = await supabase.from('articles').select('id, nom')
    return data || []
})

const articleItems = computed<SelectMenuItem[]>(() =>
    articles.value?.map((art: Article) => ({
        label: art.nom,
        id: art.id
    })) || []
)

async function onSubmit(event: FormSubmitEvent<Schema>) {
    try {
        await stockStore.createLinesDetails([{
            line_id: props.lineId,
            ...event.data
        }] as any)
        toast.add({ title: 'Succès', description: 'Numéros de lot ajoutés', color: 'success' })
        toast.add({ title: 'Succès', description: 'Ligne ajoutée', color: 'success' })
        emit('line-added')
        isOpen.value = false
    } catch (err: any) {
        toast.add({ title: 'Erreur', description: err.message, color: 'error' })
    }
}
</script>

<template>
    <UModal v-model:open="isOpen" title="Ajouter des numeros de lot" description="Indiquer les numeros de lot">
        <template #body>
            <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
                <UFormField label="Article" name="article_id">
                    <USelectMenu v-model="state.article_id" value-key="id" :items="articleItems" class="w-full"
                                 placeholder="Rechercher un article..." searchable />
                </UFormField>

                <div class="grid grid-cols-2 gap-4">
                    <UFormField label="Quantité" name="quantite_trx">
                        <UInput v-model="state.quantite_trx" type="number" class="w-full" />
                    </UFormField>

                    <UFormField label="Prix Unitaire" name="prix">
                        <UInput v-model="state.prix" type="number" step="0.01" class="w-full" />
                    </UFormField>
                </div>

                <div class="flex justify-end gap-2">
                    <UButton label="Annuler" color="neutral" variant="subtle" @click="isOpen = false" />
                    <UButton label="Ajouter" color="primary" variant="solid" type="submit" />
                </div>
            </UForm>
        </template>
    </UModal>
</template>
