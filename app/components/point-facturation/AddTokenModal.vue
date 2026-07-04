<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { Organisation } from '~/types'

const schema = z.object({
    nom: z.string().min(2, 'Trop court'),
    valeur: z.string().min(1, 'La valeur est requise'),
    date_debut: z.string().optional(),
    date_expiration: z.string().optional()
})

const props = defineProps<{
    organisation: Organisation
}>()

const open = ref(false)
const toast = useToast()
const supabase = useSupabaseClient()

type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
    nom: undefined,
    valeur: undefined,
    date_debut: new Date().toISOString().split('T')[0],
    date_expiration: undefined
})

const emit = defineEmits(['token-added'])
const loading = ref(false)

async function onSubmit(event: FormSubmitEvent<Schema>) {
    loading.value = true
    const { error } = await supabase
        .from('organisation_tokens')
        .insert([{
            organisation_id: props.organisation.id,
            nom: event.data.nom,
            valeur: event.data.valeur,
            date_debut: event.data.date_debut || null,
            date_expiration: event.data.date_expiration || null
        }] as never)

    loading.value = false
    if (error) {
        toast.add({ title: 'Erreur', description: `Impossible d'ajouter le token: ${error.message}`, color: 'error' })
    } else {
        toast.add({ title: 'Succès', description: `Nouveau token ${event.data.nom} ajouté`, color: 'success' })
        emit('token-added')
        open.value = false
        // Reset state
        state.nom = undefined
        state.valeur = undefined
        state.date_expiration = undefined
    }
}
</script>

<template>
    <UModal v-model:open="open" title="Nouveau Token" description="Ajouter un token à cette organisation">
        <UButton label="Nouveau Token" icon="i-lucide-plus" size="sm" />

        <template #body>
            <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
                <UFormField label="Nom du token" name="nom">
                    <UInput v-model="state.nom" class="w-full" placeholder="Ex: API Key Production" />
                </UFormField>
                <UFormField label="Valeur" name="valeur">
                    <UInput v-model="state.valeur" class="w-full" placeholder="Valeur du token" type="password" />
                </UFormField>
                <div class="grid grid-cols-2 gap-4">
                    <UFormField label="Date de début" name="date_debut">
                        <UInput v-model="state.date_debut" type="date" class="w-full" />
                    </UFormField>
                    <UFormField label="Date d'expiration" name="date_expiration">
                        <UInput v-model="state.date_expiration" type="date" class="w-full" />
                    </UFormField>
                </div>
                
                <div class="flex justify-end gap-2 mt-4">
                    <UButton label="Annuler" color="neutral" variant="subtle" @click="open = false" />
                    <UButton label="Ajouter" color="primary" variant="solid" type="submit" :loading="loading" />
                </div>
            </UForm>
        </template>
    </UModal>
</template>
