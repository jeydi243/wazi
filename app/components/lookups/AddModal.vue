<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

const props = defineProps({
    classe_id: {
        type: String,
        required: true
    }
})
const emit = defineEmits(['lookup_added'])
const schema = z.object({
    nom: z.string().min(3, 'Too short'),
    code: z.string().min(1, 'Too short'),
    classe_id: z.string().min(3, 'Too short'),
    description: z.string()
})
const open = ref(false)
const toast = useToast()
type Schema = z.output<typeof schema>
const supabase = useSupabaseClient()
const state = reactive<Partial<Schema>>({
    nom: undefined,
    code: undefined,
    classe_id: props.classe_id,
    description: undefined,
})
const paramStore = useParametresStore()
const classes = computed(() => paramStore.getClasseItems)

async function onSubmit(event: FormSubmitEvent<Schema>) {
    const { data, error } = await supabase
        .from('lookups')
        .insert(event?.data as never)
        .select()

    if (error) {
        toast.add({ title: 'Erreur', description: `Impossible d'ajouter le lookup ${error.message}`, color: 'error' })
    } else {
        toast.add({ title: 'Succès', description: `Nouveau lookup ${event.data.nom} ajouté`, color: 'success' })
        open.value = false
        state.code = undefined
        state.nom = undefined
        state.description = undefined
        emit('lookup_added')
    }
}



</script>

<template>
    <UModal v-model:open="open" title="Lookup" description="Ajouter un nouveau lookup">
        <UButton label="Ajouter un lookup" icon="i-lucide-plus" />

        <template #body>
            <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
                <UFormField label="Classe" placeholder="_" name="classe_id">
                    <USelectMenu v-model="state.classe_id" disabled value-key="id" :items="classes" class="w-full" />
                </UFormField>
                <UFormField label="Nom" placeholder="John Doe" name="nom">
                    <UInput v-model="state.nom" class="w-full" />
                </UFormField>
                <UFormField label="Code" placeholder="_" name="code">
                    <UInput v-model="state.code" class="w-full" />
                </UFormField>
                <UFormField label="Description" placeholder="" name="description">
                    <UInput v-model="state.description" class="w-full" />
                </UFormField>
                <div class="flex justify-end gap-2">
                    <UButton label="Cancel" color="neutral" variant="subtle" @click="open = false" />
                    <UButton label="Créer" color="primary" variant="solid" type="submit" />
                </div>
            </UForm>
        </template>
    </UModal>
</template>
