<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { Classe } from '~/types'

const props = defineProps<{
    classe?: Classe
    open: boolean
}>()

const emit = defineEmits<{
    "classe_updated": []
    'update:open': [value: boolean]
}>()

const schema = z.object({
    nom: z.string().min(3, 'Trop court'),
    code: z.string().min(3, 'Trop court'),
    description: z.string(),
    table_name: z.string()
})

const toast = useToast()
const supabase = useSupabaseClient()

const isOpen = computed({
    get: () => props.open,
    set: (value) => emit('update:open', value)
})

type Schema = z.output<typeof schema>
const state = reactive<Partial<Schema>>({
    nom: props.classe?.nom,
    code: props.classe?.code,
    description: props.classe?.description,
    table_name: props.classe?.table_name
})

watch(() => props.classe, (newClasse) => {
    if (newClasse) {
        Object.assign(state, {
            nom: newClasse.nom,
            code: newClasse.code,
            description: newClasse.description,
            table_name: newClasse.table_name
        })
    }
})

async function onSubmit(event: FormSubmitEvent<Schema>) {
    if (!props.classe?.id) return

    const { error } = await supabase
        .from('classes')
        .update(event.data)
        .eq('id', props.classe.id)
        .select()

    if (error) {
        toast.add({ title: 'Erreur', description: `Impossible de mettre à jour : ${error.message}`, color: 'error' })
    } else {
        toast.add({ title: 'Succès', description: `Classe "${event.data.nom}" mise à jour`, color: 'success' })
        emit('classe_updated')
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
                <UFormField label="Table name" name="table_name">
                    <UInput v-model="state.table_name" class="w-full" />
                </UFormField>
                <div class="flex justify-end gap-2">
                    <UButton label="Annuler" color="neutral" variant="subtle" @click="isOpen = false" />
                    <UButton label="Mettre à jour" color="primary" variant="solid" type="submit" />
                </div>
            </UForm>
        </template>
    </UModal>
</template>
