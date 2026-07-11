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

let user = useSupabaseUser()

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
    onClick: async () => {
        try {
            const { data, error } = await supabase.auth.signInWithPasskey()
            if (error) {
                toast.add({ title: 'Erreur', description: error.message, color: 'error' })
                return
            }
            if (data?.user) {
                user = useSupabaseUser()
                await router.push('/')
                toast.add({ title: 'Connexion réussie', description: 'Bienvenue via Passkey !', color: 'success' })
            }
        } catch (err: any) {
            toast.add({ title: 'Erreur', description: err.message, color: 'error' })
        }
    }
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
const supabase = useSupabaseClient()
const router = useRouter()

async function onSubmit(event: FormSubmitEvent<Schema>) {
    try {
        const { data: profil } = await supabase
            .from('profils')
            .select('*, owner:owner_id(*)')
            .eq('owner.nom', event.data.tenant as string)

        console.log({ profil }, event.data.tenant)
        if (!profil?.length) {
            toast.add({
                title: 'Erreur de connexion',
                description: `Le tenant ${event.data.tenant} n\'a pas été trouvé ou l\'utilisateur n\'existe pas. Veuillez vérifier vos informations`,
                color: 'error'
            })
            return
        }
        const { data, error } = await supabase.auth.signInWithPassword({
            email: event.data.email,
            password: event.data.password
        })

        console.log({ data }, { error })

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
            const { setOwnerID } = useParametresStore()
            setOwnerID(profil[0]?.owner_id || "")
            
            await router.push('/')

            toast.add({
                title: 'Connexion réussie',
                description: `Bienvenue ${data.user.email || ''} !`,
                color: 'success'
            })

            // Rediriger vers la page d'accueil après connexion
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