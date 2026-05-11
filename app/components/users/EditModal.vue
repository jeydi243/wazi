<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { Profil } from '~/types'

const props = defineProps({
    user: {
        type: Object as PropType<Profil | null>,
        required: true
    },
    open: {
        type: Boolean,
        required: true
    }
})

const emit = defineEmits(['update:open', 'user-updated'])

const isOpen = computed({
    get: () => props.open,
    set: (value) => emit('update:open', value)
})

const schema = z.object({
    email: z.string().email('Invalid email'),
    password: z.string().min(6, 'Password must be at least 6 characters').optional(),
    nom: z.string().min(2, 'Nom is too short').optional(),
    prenom: z.string().min(2, 'Prenom is too short'),
    postnom: z.string().min(2, 'Postnom is too short'),
})

type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
    email: props.user?.email,
    password: undefined,
    prenom: props.user?.prenom,
    nom: props.user?.nom,
    postnom: props.user?.postnom
})

const toast = useToast()

// Watch for prop changes to update the state
watch(() => props.user, (val) => {
    if (val) {
        state.email = val.email
        state.prenom = val.prenom
        state.nom = val.nom
        state.postnom = val.postnom
    }
})

async function onSubmit(event: FormSubmitEvent<Schema>) {
    if (!props.user?.user_id) {
        toast.add({ title: 'Error', description: 'User ID is missing', color: 'error' })
        return
    }

    try {
        await $fetch(`/api/users/${props.user.user_id}`, {
            method: 'PUT',
            body: {
                email: event.data.email,
                password: event.data.password,
                user_metadata: {
                    prenom: event.data.prenom,
                    nom: event.data.nom,
                    postnom: event.data.postnom,
                },
                email_confirm: true
            }
        })

        toast.add({ title: 'Success', description: `L'utilisateur ${event.data.email} a été mis à jour pour le Profil ${props.user.user_id}`, color: 'success' })
        isOpen.value = false
        emit('user-updated')
    } catch (error: any) {
        toast.add({ title: 'Error', description: error.statusMessage || error.message || 'Failed to update user', color: 'error' })
    }
}
</script>

<template>
    <UModal v-model:open="isOpen" title="Modifier l'utilisateur" description="Mettre à jour les informations du compte utilisateur">
        <template #body>
            <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
                <UFormField label="Prenom" name="prenom">
                    <UInput v-model="state.prenom" class="w-full" placeholder="Ex: John" />
                </UFormField>
                <UFormField label="Nom" name="nom">
                    <UInput v-model="state.nom" class="w-full" placeholder="Ex: Doe" />
                </UFormField>
                <UFormField label="Postnom" name="postnom">
                    <UInput v-model="state.postnom" class="w-full" placeholder="Ex: Smith" />
                </UFormField>

                <UFormField label="Email" name="email">
                    <UInput v-model="state.email" class="w-full" placeholder="john@example.com" />
                </UFormField>

                <UFormField label="Mot de passe (laisser vide pour ne pas modifier)" name="password">
                    <UInput v-model="state.password" type="password" class="w-full" placeholder="******" />
                </UFormField>

                <div class="flex justify-end gap-2">
                    <UButton label="Annuler" color="neutral" variant="subtle" @click="isOpen = false" />
                    <UButton label="Mettre à jour" color="primary" variant="solid" type="submit" />
                </div>
            </UForm>
        </template>
    </UModal>
</template>
