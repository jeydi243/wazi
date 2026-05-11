<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

const props = defineProps({
    open: { type: Boolean, required: true },
    lineId: { type: String, required: false }
})
const emit = defineEmits(['update:open', 'added'])

const supabase = useSupabaseClient()
const toast = useToast()

const isOpen = computed({
    get: () => props.open,
    set: (value) => emit('update:open', value)
})

const schema = z.object({
    numero_serie: z.string().min(1, 'Numéro de série requis'),
    statut: z.string().min(1, 'Statut requis'),
})
type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
    numero_serie: undefined,
    statut: 'ok',
})

async function onSubmit(event: FormSubmitEvent<Schema>) {
    const { error } = await supabase.from('stk_trx_details').insert({
        line_id: props.lineId,
        ...event.data
    })

    if (error) {
        toast.add({ title: 'Erreur', description: error.message, color: 'error' })
    } else {
        toast.add({ title: 'Succès', description: 'Details ajouté', color: 'success' })
        emit('added')
        isOpen.value = false
    }
}
</script>

<template>
    <UModal v-model:open="isOpen" title="Ajouter un détail" description="Saisir les informations du numero de serie">
        <template #body>
            <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
                <UFormField label="Numéro de serie" name="num_serie">
                    <UInput v-model="state.numero_serie" class="w-full" />
                </UFormField>

                <UFormField label="Statut" name="statut">
                    <USelect v-model="state.statut" :items="['ok', 'defaillant']" class="w-full" />
                </UFormField>

                <div class="flex justify-end gap-2">
                    <UButton label="Annuler" color="neutral" variant="subtle" @click="isOpen = false" />
                    <UButton label="Ajouter" color="primary" variant="solid" type="submit" />
                </div>
            </UForm>
        </template>
    </UModal>
</template>
