<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent, SelectMenuItem } from '@nuxt/ui'
import type { Lookup, Organisation } from '~/types'

const props = defineProps<{
    user_id: string | null
}>()

const emit = defineEmits(['affectation-added'])

const supabase = useSupabaseClient()
const toast = useToast()
const open = ref(false)

const schema = z.object({
    lookup_id: z.string().min(1, 'Type requis'),
    organisation_id: z.string().min(1, 'Organisation requise')
})
type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
    lookup_id: undefined,
    organisation_id: undefined,
})

// Fetch Lookups for Affectation types
const { data: lookups } = await useAsyncData('affectation-lookups', async () => {
    const { data, error } = await supabase
        .from('lookups')
        .select('id, nom, classes!inner(*)')
        .eq('classes.table_name', 'TYPE_AFFECTATION')
    if (error) throw error
    return data
})

// Fetch Services (Organisations with "Service Médicale" description in lookup)
const { data: services } = await useAsyncData('medical-services', async () => {
    const { data, error } = await supabase
        .from('organisations')
        .select('id, nom, code, lookup:lookups!inner(*)')
        .in('lookup.description', ['Service Médicale', 'Magasin'])
    if (error) throw error
    return data as unknown as Organisation[]
})

const lookupItems = computed<SelectMenuItem[]>(() => lookups.value?.map((l: any) => ({
    label: l.nom,
    id: l.id
})) || [])

const serviceItems = computed<SelectMenuItem[]>(() => services.value?.map((s: Organisation) => ({
    label: `${s.nom} (${s.code || 'N/A'})`,
    id: s.id
})) || [])

async function onSubmit(event: FormSubmitEvent<Schema>) {
    const { error } = await (supabase.from('affectations') as any)
        .insert({
            user_id: props.user_id,
            ...event.data
        })

    if (error) {
        toast.add({ title: 'Erreur', description: error.message, color: 'error' })
    } else {
        toast.add({ title: 'Succès', description: 'Affectation ajoutée avec succès', color: 'success' })
        open.value = false
        emit('affectation-added')

        // Reset state
        state.lookup_id = undefined
        state.organisation_id = undefined
    }
}
</script>

<template>
    <UModal v-model:open="open" title="Ajouter une affectation"
            description="Affecter l'utilisateur à un service ou une organisation">
        <UButton icon="i-lucide-plus" label="Affecter" color="primary" size="sm" />

        <template #body>
            <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
                <UFormField label="Type d'affectation" name="lookup_id" class="w-full">
                    <USelectMenu v-model="state.lookup_id" class="w-full" value-key="id" :items="lookupItems"
                                 placeholder="Sélectionner un type..." />
                </UFormField>

                <UFormField label="Service / Organisation" name="organisation_id" class="w-full">
                    <USelectMenu v-model="state.organisation_id" class="w-full" value-key="id" :items="serviceItems"
                                 placeholder="Choisir un service..." icon="i-lucide-building" />
                </UFormField>

                <div class="flex justify-end gap-2 pt-2">
                    <UButton label="Annuler" color="neutral" variant="subtle" @click="open = false" />
                    <UButton label="Affecter" color="primary" variant="solid" type="submit" />
                </div>
            </UForm>
        </template>
    </UModal>
</template>