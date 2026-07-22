<template>
    <div class="flex flex-col items-center justify-center gap-4 p-4 min-h-screen">
        <UPageCard class="w-full max-w-md " variant="outline">
            <UAuthForm :schema="schema" title="Login" description="Enter your credentials to access your account."
                icon="i-lucide-user" :fields="fields" :providers="providers" @submit="onSubmit" />
        </UPageCard>
    </div>
</template>

<script setup lang="ts">
    import * as z from 'zod'
    import type { FormSubmitEvent, AuthFormField } from '@nuxt/ui'

    useHead({
        title: 'Login - Wazi',
        meta: [
            { name: 'description', content: 'Login to your Wazi account.' }
        ]
    })

    const auth = useAuth()

    const fields: AuthFormField[] = [
        {
            name: 'tenant',
            type: 'text',
            label: 'Tenant',
            placeholder: 'Enter your tenant',
            required: true
        },
        {
            name: 'email',
            type: 'email',
            label: 'Email',
            placeholder: 'Enter your email',
            required: true
        },
        {
            name: 'password',
            label: 'Password',
            type: 'password',
            placeholder: 'Enter your password',
            required: true
        }]

    const providers = [{
        label: 'Passkey',
        icon: 'i-lucide-fingerprint',
        color: 'white' as const,
        onClick: () => auth.loginWithPasskey()
    }, {
        label: 'Google',
        icon: 'i-simple-icons-google',
        onClick: () => {
            toast.add({ title: 'Google', description: 'Login with Google' })
        }
    }
    ]
    definePageMeta({
        layout: 'auth'
    })

    const schema = z.object({
        email: z.email('Invalid email'),
        tenant: z.string().min(1, 'Veuillez indiquer le tenant'),
        password: z.string().min(1, 'Veuillez indiquer le mot de passe')
    })

    type Schema = z.output<typeof schema>

    const toast = useToast()

    async function onSubmit(event: FormSubmitEvent<Schema>) {
        await auth.login(event.data.tenant, event.data.email, event.data.password)
    }
</script>

<style scoped></style>