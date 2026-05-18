<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent, SelectMenuItem } from '@nuxt/ui'

import type { Affectation, Lookup, Organisation } from '~/types'

const props = defineProps<{
    parent: Organisation | null | string
}>()

const emit = defineEmits(['emplacement-added'])

const schema = z.object({
    nom: z.string().min(3, 'Too short'),
    description: z.string().optional(),
    code: z.string().min(1, 'Required'),
    lookup_id: z.string().optional(),
    organisation_parent_id: z.string().optional()
})

const open = ref(false)
const toast = useToast()
const supabase = useSupabaseClient()
const { getAffectationsMagasin } = useParametresStore()
type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
    nom: undefined,
    description: undefined,
    code: undefined,
    lookup_id: undefined,
    organisation_parent_id: undefined
})
const { data: lookups } = await useAsyncData(`lookups-emplacement-${props.parent?.id}`, async () => {
    const { data } = await supabase.from('lookups').select('id, nom, description').eq('description', 'Emplacement')
    return data
})


const itemsEmplacement = computed<SelectMenuItem[]>(() => lookups.value?.map((lookup: Lookup) => ({
    label: lookup.nom,
    id: lookup.id
})) || [])

const itemsMagasin = computed<SelectMenuItem[]>(() => getAffectationsMagasin.map((a: Affectation) => ({
    label: a.organisation?.nom || '',
    id: a.organisation?.id || ''
})) || [])

async function onSubmit(event: FormSubmitEvent<Schema>) {
    console.log(props.parent)
    if (!props.parent) return
    const { error } = await supabase.from('organisations')
        .insert({
            nom: event.data.nom,
            description: event.data.description,
            code: event.data.code,
            lookup_id: event.data.lookup_id,
            organisation_parent_id: props.parent.id
        } as never)


    if (error) {
        toast.add({ title: 'Erreur', description: error.code + ':' + (error.hint || error.message), color: 'error' })
    } else {
        toast.add({ title: 'Succès', description: `Service ${event.data.nom} ajouté`, color: 'success' })
        emit('emplacement-added')
        open.value = false
        // Reset state
        state.nom = undefined
        state.description = undefined
        state.code = undefined
        state.lookup_id = undefined
    }
}
</script>

<template>
    <UModal v-model:open="open" title="Ajouter un emplacement" :dismissible="false"
            description="Ajouter un emplacement dans cette organisation">
        <UButton label="Nouvel Emplacement" icon="i-lucide-plus" size="sm" variant="subtle" />

        <template #body>
            <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
                <UFormField label="Magasin" name="organisation_parent_id">
                    <USelectMenu v-model="state.organisation_parent_id" value-key="id" :items="itemsMagasin" class="w-full" :default-value="props.parent?.id" />
                </UFormField>
                <UFormField label="Type d'organisation" name="type">
                    <USelectMenu v-model="state.lookup_id" value-key="id" :items="itemsEmplacement" class="w-full" />
                </UFormField>
                <UFormField label="Code" name="code">
                    <UInput v-model="state.code" class="w-full" placeholder="Ex: EMP-01" />
                </UFormField>
                <UFormField label="Nom" name="nom">
                    <UInput v-model="state.nom" class="w-full" placeholder="Nom de l'emplacement" />
                </UFormField>
                <UFormField label="Description" name="description">
                    <UTextarea v-model="state.description" class="w-full" placeholder="Description courte..." />
                </UFormField>

                <div class="flex justify-end gap-2">
                    <UButton label="Annuler" color="neutral" variant="subtle" @click="open = false" />
                    <UButton label="Ajouter" color="primary" variant="solid" type="submit" />
                </div>
            </UForm>
        </template>
    </UModal>
</template>
