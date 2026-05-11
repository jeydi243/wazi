<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent, SelectMenuItem } from '@nuxt/ui'
import type { Article, Organisation, STKHeader } from '~/types'

const props = defineProps<{
    open: boolean
    header: STKHeader | null
}>()
const emit = defineEmits(['update:open', 'line-added'])
const form = useTemplateRef('form')
const supabase = useSupabaseClient()
const toast = useToast()
const isOpenAddLotNumbers = ref(false)

const isOpen = computed({
    get: () => props.open,
    set: (value) => emit('update:open', value)
})

const schema = z.object({
    numero_lot: z.string().optional(),
    header_id: z.string({ message: 'Veuillez sélectionner un header' }),
    article_id: z.string({ message: 'Veuillez sélectionner un article' }),
    quantite_trx: z.number({ message: 'Quantité invalide' }).min(1, 'Quantité invalide'),
    prix_unitaire: z.number({ message: 'Prix invalide' }).min(1, 'Prix invalide'),
    in_location_id: z.string({ message: 'Veuillez sélectionner un emplacement de réception' }).optional(),
    out_location_id: z.string({ message: 'Veuillez sélectionner un emplacement de sortie' }).optional(),

})
type Schema = z.output<typeof schema>

const defaultState = {
    header_id: props.header?.id,
    article_id: undefined,
    quantite_trx: 1,
    prix_unitaire: 1,
    numero_lot: '',
    in_location_id: undefined,
    out_location_id: undefined,
}

const state = reactive<Partial<Schema>>({ ...defaultState })

const { data: articles } = await useLazyAsyncData('articles-select', async () => {
    const { data } = await supabase.from('articles')
        .select('*, lookup:lookup_id!inner(*)')
        .eq('lookup.code', 'ART-PTP')
    console.log(data)
    return data || []
})

// const { data: emplacements } = await useLazyAsyncData('emplacements-select', async () => {
//     const { data } = await supabase.from('organisations')
//         .select('id, nom, lookup:lookup_id!inner(*)')
//         .eq('lookup.description', 'Emplacement')
//         .eq('organisation_parent_id', props.header?.in_organisation?.id!)
//     console.log(data)
//     return data || []
// })

const parametres = useParametresStore()
const emplacements = computed(() => parametres.getEmplacements(props.header?.in_organisation?.id!))
console.log("there is emplacements : ", emplacements, " for Organisation  ", props.header?.in_organisation?.nom, ' with ID : ', props.header?.in_organisation?.id)
const articleItems = computed<SelectMenuItem[]>(() =>
    articles.value?.map((art: Article) => ({
        label: art.nom,
        id: art.id
    })) || []
)
const itemsEmplacements = computed<SelectMenuItem[]>(() =>
    emplacements.value?.map((org: Organisation) => ({
        label: org.nom,
        id: org.id
    })) || []
)

async function onSubmit(event: FormSubmitEvent<Schema>) {
    const { data, error } = await supabase
        .from('stk_trx_lines')
        .insert({
            // header_id: props.header?.id,
            ...event.data
        } as never)
        .select()

    if (error) {
        toast.add({ title: 'Erreur', description: error.message, color: 'error' })
    } else {
        toast.add({ title: 'Succès', description: 'Ligne ajoutée', color: 'success' })
        emit('line-added')
        isOpen.value = false
        Object.assign(state, defaultState)
    }
}
</script>

<template>
    <UModal v-model:open="isOpen" title="Ajouter une ligne" description="Sélectionner l'article et définir la quantité">
        <template #body>
            <UForm ref="form" :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
                <UFormField label="Article" name="article_id">
                    <USelectMenu v-model="state.article_id" virtualize value-key="id" :items="articleItems"
                        class="w-full" placeholder="Rechercher un article..." searchable />
                </UFormField>

                <UFormField label="Numéro de lot" name="numero_lot">
                    <UInput v-model="state.numero_lot" class="w-full" placeholder="Entrez le numéro de lot" />
                </UFormField>

                <UFormField label="Emplacement de réception" name="in_location_id">
                    <USelectMenu v-model="state.in_location_id" value-key="id" :items="itemsEmplacements" class="w-full"
                        placeholder="Rechercher un emplacement de réception..." searchable />
                </UFormField>

                <!-- <UFormField label="Emplacement de sortie" name="out_location_id">
                    <USelectMenu v-model="state.out_location_id" value-key="id" :items="articleItems" class="w-full"
                        placeholder="Rechercher un emplacement de sortie..." searchable />
                </UFormField> -->

                <div class="grid grid-cols-2 gap-4">
                    <UFormField label="Quantité" name="quantite_trx">
                        <UInput v-model="state.quantite_trx" type="number" class="w-full" />
                    </UFormField>

                    <UFormField label="Prix Unitaire" name="prix_unitaire">
                        <UInput v-model="state.prix_unitaire" type="number" step="0.01" class="w-full" />
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
