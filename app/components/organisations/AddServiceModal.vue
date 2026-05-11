<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

import type { Organisation } from '~/types'

const props = defineProps<{
    parent: Organisation | null
}>()

const emit = defineEmits(['service-added'])

const schema = z.object({
    nom: z.string().min(3, 'Too short'),
    description: z.string().optional(),
    code: z.string().min(1, 'Required'),
})

const open = ref(false)
const toast = useToast()
const supabase = useSupabaseClient()

type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
    nom: undefined,
    description: undefined,
    code: undefined,
})


async function onSubmit(event: FormSubmitEvent<Schema>) {
    if (!props.parent?.id) return

    // Find lookup_id for 'Service'
    const { data: lookupData, error: lookupError } = await supabase
        .from('lookups')
        .select('id')
        .eq('description', 'Service Médicale')
        .single()

    if (lookupError || !(lookupData as any)) {
        toast.add({ title: 'Erreur', description: 'Impossible de trouver le type "Service Médicale"', color: 'error' })
        return
    }

    const { data, error } = await (supabase.from('organisations') as any)
        .insert({
            nom: event.data.nom,
            description: event.data.description,
            code: event.data.code,
            lookup_id: (lookupData as any).id,
            organisation_parent_id: props.parent.id
        })
        .select()

    if (error) {
        toast.add({ title: 'Erreur', description: error.message, color: 'error' })
    } else {
        toast.add({ title: 'Succès', description: `Service ${event.data.nom} ajouté`, color: 'success' })
        emit('service-added')
        open.value = false
        // Reset state
        state.nom = undefined
        state.description = undefined
        state.code = undefined
    }
}
</script>

<template>
    <UModal v-model:open="open" title="Ajouter un Service" description="Ajouter un service enfant à cette organisation">
        <UButton label="Nouveau Service" icon="i-lucide-plus" size="sm" variant="subtle" />

        <template #body>
            <div v-if="props.parent" class="mb-4 p-3 bg-(--ui-bg-elevated) rounded-lg border border-(--ui-border) text-sm">
                <p class="text-(--ui-text-muted) flex items-center gap-2 mb-1">
                    <UIcon name="i-lucide-building" />
                    Organisation Parente
                </p>
                <p class="font-medium text-(--ui-text-highlighted)">
                    {{ props.parent.nom }} 
                    <span class="text-xs font-mono opacity-60 ml-1">({{ props.parent.code || 'N/A' }})</span>
                </p>
            </div>

            <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
                <UFormField label="Code" name="code">
                    <UInput v-model="state.code" class="w-full" placeholder="Ex: SERV-01" />
                </UFormField>
                <UFormField label="Nom" name="nom">
                    <UInput v-model="state.nom" class="w-full" placeholder="Nom du service" />
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
