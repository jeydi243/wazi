<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { Lookup } from '~/types'

const props = defineProps({
    lookup: {
        type: Object as PropType<Lookup | null>,
        required: true
    },
    open: {
        type: Boolean,
        required: true,
        default: false,

    }
})
const emit = defineEmits(['lookup_updated', 'update:open'])
const schema = z.object({
    nom: z.string().min(3, 'Too short'),
    code: z.string().min(3, 'Too short'),
    classe_id: z.string().min(3, 'Too short'),
    description: z.string()
})
const toast = useToast()
const isOpen = computed({
    get: () => props.open,
    set: (value) => emit('update:open', value)
})

type Schema = z.output<typeof schema>
const supabase = useSupabaseClient()
const state = reactive<Partial<Schema>>({ ...props.lookup })

watch(() => props.lookup, (newLookup) => {
    if (newLookup) {
        Object.assign(state, newLookup)
    }
})

const paramStore = useParametresStore()
const classes = computed(() => paramStore.getClasseItems)

async function onSubmit(event: FormSubmitEvent<Schema>) {
    console.log('date to update: %o with ID ', event.data, props.lookup?.id)
    const { data, error } = await supabase
        .from('lookups')
        .update(event?.data)
        .eq('id', props.lookup?.id || '')
        .select()
    console.log('data updated: %o', data)
    if (error) {
        toast.add({ title: 'Error', description: `Can't update lookup ${error.message}`, color: 'error' })
    } else {
        toast.add({ title: 'Success', description: `Lookup ${event.data.nom} updated`, color: 'success' })
        emit('lookup_updated')
        isOpen.value = false
    }
}



</script>

<template>
    <UModal v-model:open="isOpen" title="Lookup" description="Update lookup ">
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
                    <UButton label="Cancel" color="neutral" variant="subtle" @click="isOpen = false" />
                    <UButton label="Update" color="primary" variant="solid" type="submit" />
                </div>
            </UForm>
        </template>
    </UModal>
</template>
