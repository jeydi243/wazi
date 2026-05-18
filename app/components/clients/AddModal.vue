<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent, SelectMenuItem } from '@nuxt/ui'
import type { Client, Lookup } from '~/types'

const parametresStore = useParametresStore()
const supabase = useSupabaseClient()
const open = ref(false)
const toast = useToast()

const getTypeClient = computed(() => parametresStore.getTypeClient)

const itemsTypeClient = computed<SelectMenuItem[]>(() => getTypeClient.value?.map((item: any) => ({
    label: item.nom,
    id: item.id
})) || [])

const selectedTypeCode = computed(() => {
    return getTypeClient.value?.find((item: any) => item.id === state.type_id)?.code
})

const ClientSchema = z.object({
    code: z.string().min(1, 'Code must be at least 1 character'),
    nom: z.string().min(1, 'Name must be at least 1 character'),
    description: z.string().min(1, 'Description must be at least 1 character'),
    nif: z.string().optional(),
    type_id: z.string().min(1, 'Veuillez sélectionner un type de client')
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

type Schema = z.output<typeof ClientSchema>

const state = reactive<Partial<Schema>>({
    code: generateRandomCode(),
    nom: undefined,
    description: undefined,
    type_id: undefined,
    nif: undefined,
})

function generateRandomCode(length = 6) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length))
    }
    return result
}

const { data: lookups } = await useAsyncData<Client[]>('clients-type', async () => {
    const { data } = await supabase.from('lookups').select('*').eq('classes.table_name', 'TYPE_CLIENTS')
    return (data || []) as unknown as Client[]
})

const items = computed<SelectMenuItem[]>(() => lookups.value?.map(lookup => ({
    label: lookup?.nom,
    id: String(lookup?.id)
})) || [])

const emit = defineEmits(['client-added'])

async function onSubmit(event: FormSubmitEvent<Schema>) {
    const { data, error } = await supabase
        .from('clients')
        .insert(event?.data as any)
        .select()

    if (error) {
        toast.add({ title: 'Error', description: `Can't add new client ${error.message}`, color: 'error' })
    } else {
        toast.add({ title: 'Success', description: `New client ${event.data.nom} added`, color: 'success' })
        open.value = false
        emit('client-added')
        // Réinitialiser le code après soumission réussie
        state.code = generateRandomCode()
    }
}
</script>

<template>
    <UModal v-model:open="open" title="Ajouter un client" description="Ajouter un client">
        <UButton label="Ajouter un client" icon="i-lucide-plus" />

        <template #body>
            <UForm :schema="ClientSchema" :state="state" class="space-y-4" @submit="onSubmit">
                <UFormField label="Code" name="code">
                    <UInput v-model="state.code" class="w-full" placeholder="Code de l'article">
                        <template #trailing>
                            <UButton icon="i-lucide-refresh-cw" color="neutral" variant="ghost" size="xs"
                                     @click="state.code = generateRandomCode()" />
                        </template>
                    </UInput>
                </UFormField>
                <UFormField label="Nom" name="nom">
                    <UInput v-model="state.nom" class="w-full" placeholder="Nom de l'article" />
                </UFormField>
                <UFormField label="Type de client" name="type_id">
                    <USelectMenu v-model="state.type_id" value-key="id" :items="itemsTypeClient" class="w-full" />
                </UFormField>
                <UFormField v-if="selectedTypeCode != 'PP'" label="NIF" name="nif">
                    <UInput v-model="state.nif" class="w-full" placeholder="NIF" />
                </UFormField>

                <UFormField label="Description" name="description">
                    <UTextarea v-model="state.description" class="w-full" placeholder="Description de l'article" />
                </UFormField>

                <div class="flex justify-end gap-2">
                    <UButton label="Annuler" color="neutral" variant="subtle" @click="open = false" />
                    <UButton label="Ajouter un client" color="primary" variant="solid" type="submit" />
                </div>
            </UForm>
        </template>
    </UModal>
</template>
