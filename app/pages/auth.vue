<template>
    <div class="flex flex-col items-center justify-center gap-4 p-4 min-h-screen">
        <UPageCard class="w-full max-w-md">
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

let user = useSupabaseUser()

const fields: AuthFormField[] = [{
    name: 'email',
    type: 'email',
    label: 'Email',
    placeholder: 'Enter your email',
    required: true
}, {
    name: 'password',
    label: 'Password',
    type: 'password',
    placeholder: 'Enter your password',
    required: true
}]
const providers = [{
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
    email: z.string().email('Invalid email'),
    password: z.string().min(8, 'Must be at least 8 characters')
})

type Schema = z.output<typeof schema>

const toast = useToast()
const supabase = useSupabaseClient()
const router = useRouter()

async function onSubmit(event: FormSubmitEvent<Schema>) {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: event.data.email,
            password: event.data.password
        })

        console.log({ error })

        if (error) {
            toast.add({
                title: 'Erreur de connexion',
                description: error.message,
                color: 'error'
            })
            return
        }

        if (data.user) {
            // Mettre à jour l'utilisateur
            user = useSupabaseUser()

            toast.add({
                title: 'Connexion réussie',
                description: `Bienvenue ${data.user.email || ''} !`,
                color: 'success'
            })

            // Rediriger vers la page d'accueil après connexion
            await router.push('/')
        }
    } catch (error) {
        console.error('Erreur lors de la connexion:', error)
        toast.add({
            title: 'Erreur',
            description: 'Une erreur inattendue s\'est produite',
            color: 'error'
        })
    }
}
</script>

<style scoped></style>