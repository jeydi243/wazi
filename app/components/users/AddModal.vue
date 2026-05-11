<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

const schema = z.object({
    email: z.string().email('Invalid email'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    nom: z.string().min(2, 'Nom is too short').optional(),
    prenom: z.string().min(2, 'Prenom is too short'),
    postnom: z.string().min(2, 'Postnom is too short'),
})

const open = ref(false)
const toast = useToast()
type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
    email: undefined,
    password: undefined,
    prenom: undefined,
    nom: undefined,
    postnom: undefined
})

const emit = defineEmits(['user-added'])

async function onSubmit(event: FormSubmitEvent<Schema>) {
    try {
        await $fetch('/api/users', {
            method: 'POST',
            body: {
                email: event.data.email,
                password: event.data.password,
                user_metadata: {
                    prenom: event.data.prenom,
                    nom: event.data.nom,
                    postnom: event.data.postnom,
                }
            }
        })

        toast.add({ title: 'Success', description: `User ${event.data.email} added successfully`, color: 'success' })
        open.value = false
        emit('user-added')

        // Reset form
        state.email = undefined
        state.password = undefined
        state.nom = undefined
        state.prenom = undefined
        state.postnom = undefined
    } catch (error: any) {
        toast.add({ title: 'Error', description: error.statusMessage || error.message || 'Failed to add user', color: 'error' })
    }
}
</script>

<template>
    <UModal v-model:open="open" title="Add User" description="Create a new user account">
        <UButton label="Add User" icon="i-lucide-plus" />

        <template #body>
            <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
                <UFormField label="Prenom" name="prenom">
                    <UInput v-model="state.prenom" class="w-full" placeholder="John Doe" />
                </UFormField>
                <UFormField label="Nom" name="nom">
                    <UInput v-model="state.nom" class="w-full" placeholder="Doe" />
                </UFormField>
                <UFormField label="Postnom" name="postnom">
                    <UInput v-model="state.postnom" class="w-full" placeholder="Doe" />
                </UFormField>

                <UFormField label="Email" name="email">
                    <UInput v-model="state.email" class="w-full" placeholder="john@example.com" />
                </UFormField>

                <UFormField label="Password" name="password">
                    <UInput v-model="state.password" type="password" class="w-full" placeholder="******" />
                </UFormField>

                <div class="flex justify-end gap-2">
                    <UButton label="Cancel" color="neutral" variant="subtle" @click="open = false" />
                    <UButton label="Create User" color="primary" variant="solid" type="submit" />
                </div>
            </UForm>
        </template>
    </UModal>
</template>
