<script setup lang="ts">
const colorMode = useColorMode()
const { idle } = useIdle(2 * 60 * 1000) // 2 minutes
const { isOnline } = useNetwork()

const color = computed(() => colorMode.value === 'dark' ? '#111827' : 'white')

useHead({
    meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { key: 'theme-color', name: 'theme-color', content: color }
    ],
    link: [
        { rel: 'icon', href: '/favicon.ico' }
    ],
    htmlAttrs: {
        lang: 'fr'
    }
})

const title = 'Wazi — Gestion médicale'
const description = 'Wazi est une application de gestion médicale pour la prise en charge des patients, rendez-vous et consultations.'

useSeoMeta({
    title,
    description,
    ogTitle: title,
    ogDescription: description,
})

const user = useSupabaseUser()
const parametresStore = useParametresStore()
const toast = useToast()

watch(user, async (newUser) => {
    if (newUser) {
        const { error: initError } = await parametresStore.init()
        if (initError) {
            console.error('[Store] Erreur init parametres:', initError)
            toast.add({
                title: 'Erreur de chargement',
                description: 'Impossible de charger les paramètres. Veuillez rafraîchir la page.',
                color: 'error'
            })
        }

        const { error: userError } = await parametresStore.init_user()
        if (userError) {
            console.error('[Store] Erreur init_user:', userError)
        }
    }
}, { immediate: true })

watch(idle, (isIdle) => {
    if (isIdle && user.value) {
        toast.add({
            title: 'Session inactive',
            description: 'Vous êtes inactif depuis 2 minutes. Vos données sont protégées.',
            color: 'warning',
            icon: 'i-lucide-shield-alert'
        })
    }
})

watch(isOnline, (online) => {
    if (!online) {
        toast.add({
            title: 'Hors connexion',
            description: 'Vous avez perdu votre connexion internet. Attention à vos saisies.',
            color: 'error',
            icon: 'i-lucide-wifi-off'
        })
    } else {
        toast.add({
            title: 'Connexion rétablie',
            description: 'Vous êtes de nouveau en ligne.',
            color: 'success',
            icon: 'i-lucide-wifi'
        })
    }
})
</script>

<template>
    <UApp>
        <NuxtLoadingIndicator />
        <div data-vaul-drawer-wrapper>
            <NuxtLayout>
                <NuxtPage />
            </NuxtLayout>
        </div>
    </UApp>
</template>

<style>
.page-enter-active,
.page-leave-active {
    transition: all 0.3s ease;
}

.page-enter-from,
.page-leave-to {
    opacity: 0;
    filter: blur(4px);
}

.layout-enter-active,
.layout-leave-active {
    transition: all 0.3s ease;
}

.layout-enter-from,
.layout-leave-to {
    opacity: 0;
    transform: translateX(-8px);
}
</style>
