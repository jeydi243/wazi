<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent, SelectMenuItem } from '@nuxt/ui'
import type { Client } from '~/types'

const props = defineProps<{
    client?: Client | null
    open: boolean
}>()

const emit = defineEmits<{
    "client_updated": []
    'update:open': [value: boolean]
}>()

const schema = z.object({
    nom: z.string().min(3, 'Trop court'),
    code: z.string().min(3, 'Trop court'),
    description: z.string(),
    type_id: z.string().min(1, 'Veuillez sélectionner un type de client')
})

const toast = useToast()
const supabase = useSupabaseClient()
const parametresStore = useParametresStore()
const isOpen = computed({
    get: () => props.open,
    set: (value) => emit('update:open', value)
})

const getTypeClient = computed(() => parametresStore.getTypeClient)
const itemsTypeClients = computed<SelectMenuItem[]>(() => getTypeClient.value?.map((item: any) => ({
    label: item.nom,
    id: item.id
})) || [])

type Schema = z.output<typeof schema>
const state = reactive<Partial<Schema>>({
    nom: props.client?.nom,
    code: props.client?.code,
    description: props.client?.description
})

watch(() => props.client, (newClient) => {
    if (newClient) {
        Object.assign(state, {
            nom: newClient.nom,
            code: newClient.code,
            description: newClient.description,
            type_id: newClient.type.id
        })
    }
})

async function onSubmit(event: FormSubmitEvent<Schema>) {
    if (!props.client?.id) return

    const { error } = await supabase
        .from('clients')
        .update(event.data as never)
        .eq('id', props.client.id)
        .select()

    if (error) {
        toast.add({ title: 'Erreur', description: `Impossible de mettre à jour : ${error.message}`, color: 'error' })
    } else {
        toast.add({ title: 'Succès', description: `Client "${event.data.nom}" mise à jour`, color: 'success' })
        emit('client_updated')
        isOpen.value = false
    }
}
</script>

<template>
    <UModal v-model:open="isOpen" title="Modifier la classe" description="Mettre à jour les informations de la classe">
        <template #body>
            <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
                <UFormField label="Nom" name="nom">
                    <UInput v-model="state.nom" class="w-full" />
                </UFormField>
                <UFormField label="Code" name="code">
                    <UInput v-model="state.code" class="w-full" />
                </UFormField>
                <UFormField label="Description" name="description">
                    <UInput v-model="state.description" class="w-full" />
                </UFormField>
                <UFormField label="Type de client" name="type_id">
                    <USelectMenu v-model="state.type_id" value-key="id" :items="itemsTypeClients" class="w-full" />
                </UFormField>
                <div class="flex justify-end gap-2">
                    <UButton label="Annuler" color="neutral" variant="subtle" @click="isOpen = false" />
                    <UButton label="Mettre à jour" color="primary" variant="solid" type="submit" />
                </div>
            </UForm>
        </template>
    </UModal>
</template>
