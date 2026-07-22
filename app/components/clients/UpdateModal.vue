<template>
    <UModal v-model:open="isOpen" title="Modifier le client" description="Mettre à jour les informations du client">
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
                <UFormField v-if="selectedTypeCode != 'PP'" label="NIF" name="nif">
                    <UInput v-model="state.nif" class="w-full" />
                </UFormField>
                <div class="flex justify-end gap-2">
                    <UButton label="Annuler" color="neutral" variant="subtle" @click="isOpen = false" />
                    <UButton label="Mettre à jour" color="primary" variant="solid" type="submit" />
                </div>
            </UForm>
        </template>
    </UModal>
</template>

<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent, SelectMenuItem } from '@nuxt/ui'
import type { Client } from '~/types'

const toast = useToast()
const clientsStore = useClientsStore()
const supabase = useSupabaseClient()
const parametresStore = useParametresStore()

const props = defineProps<{
    client?: Client | null
    open: boolean
}>()

const emit = defineEmits<{
    "client-updated": []
    'update:open': [value: boolean]
}>()

const isOpen = computed({
    get: () => props.open,
    set: (value) => emit('update:open', value)
})

const getTypeClient = computed(() => parametresStore.getTypeClient)
const itemsTypeClients = computed<SelectMenuItem[]>(() => getTypeClient.value?.map((item: any) => ({
    label: item.nom,
    id: item.id
})) || [])

const selectedTypeCode = computed(() => {
    return getTypeClient.value?.find((item: any) => item.id === state.type_id)?.code
})

const schema = z.object({
    nom: z.string().min(3, 'Trop court'),
    code: z.string().min(3, 'Trop court'),
    description: z.string(),
    type_id: z.string().min(1, 'Veuillez sélectionner un type de client'),
    nif: z.string().optional(),
}).refine(data => {
    const code = getTypeClient.value?.find((item: any) => item.id === data.type_id)?.code;
    if (code != 'PP') {
        return !!data.nif && data.nif.trim().length > 0;
    }
    return true;
}, {
    message: "Le NIF est requis pour ce type de client",
    path: ["nif"]
})

type Schema = z.output<typeof schema>
const state = reactive<Partial<Schema>>({
    nom: props.client?.nom,
    code: props.client?.code,
    description: props.client?.description,
    type_id: props.client?.type?.id,
    nif: props.client?.nif
})

watch(() => props.client, (newClient) => {
    if (newClient) {
        Object.assign(state, {
            nom: newClient.nom,
            code: newClient.code,
            description: newClient.description,
            type_id: newClient.type?.id,
            nif: newClient.nif,
        })
    }
})

async function onSubmit(event: FormSubmitEvent<Schema>) {
    if (!props.client?.id) return
    try {
        await clientsStore.update(props.client.id, event.data as any)
        toast.add({ title: 'Succès', description: `Client "${event.data.nom}" mis à jour`, color: 'success' })
        emit('client-updated')
        isOpen.value = false
        state.nom = undefined
        state.code = undefined
        state.description = undefined
        state.type_id = undefined
        state.nif = undefined
    } catch (err: any) {
        toast.add({ title: 'Erreur', description: err.message, color: 'error' })
    }
}
</script>
