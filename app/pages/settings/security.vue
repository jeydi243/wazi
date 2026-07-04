<script setup lang="ts">
import * as z from 'zod'
import type { FormError } from '@nuxt/ui'

useHead({
    title: 'Security - Settings',
    meta: [
        { name: 'description', content: 'Manage security settings.' }
    ]
})


const passwordSchema = z.object({
    current: z.string().min(8, 'Must be at least 8 characters'),
    new: z.string().min(8, 'Must be at least 8 characters')
})

type PasswordSchema = z.output<typeof passwordSchema>

const password = reactive<Partial<PasswordSchema>>({
    current: undefined,
    new: undefined
})

const validate = (state: Partial<PasswordSchema>): FormError[] => {
    const errors: FormError[] = []
    if (state.current && state.new && state.current === state.new) {
        errors.push({ name: 'new', message: 'Passwords must be different' })
    }
    return errors
}

const supabase = useSupabaseClient()
const toast = useToast()
const registerPasskeyLoading = ref(false)

async function registerPasskey() {
    registerPasskeyLoading.value = true
    try {
        const { data, error } = await supabase.auth.registerPasskey()
        if (error) {
            toast.add({ title: 'Erreur', description: error.message, color: 'error' })
        } else {
            toast.add({ title: 'Succès', description: 'Passkey enregistré avec succès.', color: 'success' })
        }
    } catch (err: any) {
        toast.add({ title: 'Erreur', description: err.message, color: 'error' })
    } finally {
        registerPasskeyLoading.value = false
    }
}
</script>

<template>
    <div>
        <UPageCard title="Password" description="Confirm your current password before setting a new one." variant="subtle">
            <UForm :schema="passwordSchema" :state="password" :validate="validate" class="flex flex-col gap-4 max-w-xs">
                <UFormField name="current">
                    <UInput v-model="password.current" type="password" placeholder="Current password" class="w-full" />
                </UFormField>

                <UFormField name="new">
                    <UInput v-model="password.new" type="password" placeholder="New password" class="w-full" />
                </UFormField>

                <UButton label="Update" class="w-fit" type="submit" />
            </UForm>
        </UPageCard>

        <UPageCard title="Passkeys" description="Ajoutez un Passkey pour vous connecter rapidement avec Face ID, Touch ID ou Windows Hello sans utiliser de mot de passe." variant="subtle" class="mt-8">
            <template #footer>
                <UButton label="Enregistrer un Passkey" icon="i-lucide-fingerprint" color="primary" variant="solid" :loading="registerPasskeyLoading" @click="registerPasskey" />
            </template>
        </UPageCard>

        <UPageCard title="Account"
                   description="No longer want to use our service? You can delete your account here. This action is not reversible. All information related to this account will be deleted permanently."
                   class="bg-gradient-to-tl from-(--ui-error)/10 from-5% to-(--ui-bg)">
            <template #footer>
                <UButton label="Delete account" color="error" />
            </template>
        </UPageCard>
    </div>
</template>
