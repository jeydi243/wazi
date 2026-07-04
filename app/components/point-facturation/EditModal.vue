<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent, SelectMenuItem } from '@nuxt/ui'
import type { Organisation } from '~/types'

const schema = z.object({
    nom: z.string().min(3, 'Too short'),
    description: z.string(),
    code: z.string(),
    type_id: z.string(),
    nid: z.string().optional(),
})
const props = defineProps<{
    open: boolean
    organisation: Organisation | null
}>()

const emit = defineEmits(['update:open', 'point-facturation-updated'])

const isOpen = computed({
    get: () => props.open,
    set: (value) => emit('update:open', value)
})

const toast = useToast()
type Schema = z.output<typeof schema>
const supabase = useSupabaseClient()
const parametresStore = useParametresStore()

const state = reactive<Partial<Schema>>({
    nom: undefined,
    description: undefined,
    code: undefined,
    type_id: undefined,
    nid: undefined
})

watch(() => props.organisation, (newOrg) => {
    if (newOrg) {
        state.nom = newOrg.nom
        state.description = newOrg.description
        state.code = newOrg.code
        // @ts-ignore
        state.type_id = newOrg.lookup?.id || newOrg.type_id
        state.nid = newOrg.nid
    } else {
        state.nom = undefined
        state.description = undefined
        state.code = undefined
        state.type_id = undefined
        state.nid = undefined
    }
}, { immediate: true })

const getTypeOrganisations = computed(() => parametresStore.getTypeOrganisations)
const itemsOrganisation = computed<SelectMenuItem[]>(() => getTypeOrganisations.value?.map((org: any) => ({
    label: org.nom,
    id: org.id
})) || [])

const loading = ref(false)

async function onSubmit(event: FormSubmitEvent<Schema>) {
    if (!props.organisation?.id) return
    loading.value = true
    const { data, error } = await supabase
        .from('organisations')
        .update({
            nom: event.data.nom,
            description: event.data.description,
            code: event.data.code,
            type_id: event.data.type_id,
            nid: event.data.nid
        })
        .eq('id', props.organisation.id)
        .select()

    loading.value = false
    if (error) {
        toast.add({ title: 'Erreur', description: `Impossible de modifier : ${error.message}`, color: 'error' })
    } else {
        toast.add({ title: 'Succès', description: `L'organisation a été modifiée`, color: 'success' })
        emit('point-facturation-updated')
        isOpen.value = false
    }
}
</script>

<template>
    <UModal v-model:open="isOpen" title="Modifier" description="Modifier les informations de l'organisation">
        <template #body>
            <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
                <UFormField label="Type d'organisation" name="type_id">
                    <USelectMenu v-model="state.type_id" value-key="id" :items="itemsOrganisation" class="w-full" />
                </UFormField>
                <UFormField label="Code" name="code">
                    <UInput v-model="state.code" class="w-full" />
                </UFormField>
                <UFormField label="Nom" name="nom">
                    <UInput v-model="state.nom" class="w-full" />
                </UFormField>
                <UFormField label="Description" name="description">
                    <UTextarea v-model="state.description" class="w-full" />
                </UFormField>
                <UFormField label="NID" name="nid">
                    <UInput v-model="state.nid" class="w-full" />
                </UFormField>
                <div class="flex justify-end gap-2">
                    <UButton label="Annuler" color="neutral" variant="subtle" @click="isOpen = false" />
                    <UButton label="Enregistrer" color="primary" variant="solid" type="submit" :loading="loading" />
                </div>
            </UForm>
        </template>
    </UModal>
</template>
