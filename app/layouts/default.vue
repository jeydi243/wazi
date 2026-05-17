<script setup lang="ts">
const route = useRoute()
const toast = useToast()

const open = useLocalStorage('dashboard-sidebar-open', true)

const links = [
    [{
        label: 'Home',
        icon: 'i-lucide-house',
        to: '/',
        onSelect: () => {
            open.value = false
        }
    }, {
        label: 'Inbox',
        icon: 'i-lucide-inbox',
        to: '/inbox',
        badge: '4',
        onSelect: () => {
            open.value = false
        }
    },
    {
        label: 'Patients',
        icon: 'i-lucide-users',
        to: '/patients',
        onSelect: () => {
            open.value = false
        }
    },

    {
        label: 'Facturation',
        icon: 'i-lucide-users',
        to: '/facturation',
        onSelect: () => {
            open.value = false
        }
    },
    {
        label: 'Stock',
        to: '/stock',
        icon: 'solar:posts-carousel-vertical-broken',
        defaultOpen: true,
        children: [{
            label: 'Stock',
            icon: 'solar:settings-bold-duotone',
            to: '/stock',
            exact: true,
            onSelect: () => {
                open.value = false
            }
        }, {
            label: 'Transfert de stock',
            to: '/stock/transfert-stock',
            icon: 'solar:card-transfer-bold-duotone',
            onSelect: () => {
                open.value = false
            }
        }, {
            label: 'Reception externe',
            to: '/stock/reception-externe',
            icon: 'solar:card-transfer-bold-duotone',
            onSelect: () => {
                open.value = false
            }
        },
        {
            label: 'Reception interne',
            to: '/stock/reception-interne',
            icon: 'octicon:organization-16',
            onSelect: () => {
                open.value = false
            }
        }]
    },
    {
        label: 'Parametres',
        to: '/settings',
        icon: 'i-lucide-settings',
        defaultOpen: true,
        children: [{
            label: 'Parametres',
            icon: 'solar:settings-bold-duotone',
            to: '/settings',
            exact: true,
            onSelect: () => {
                open.value = false
            }
        }, {
            label: 'Classes & Lookups',
            to: '/settings/lookups',
            icon: 'solar:card-transfer-bold-duotone',
            onSelect: () => {
                open.value = false
            }
        },
        {
            label: 'Grille tarifaire',
            to: '/settings/tarifaire',
            icon: 'solar:tag-price-bold-duotone',
            onSelect: () => {
                open.value = false
            }
        },
        {
            label: 'Utilisateurs',
            to: '/settings/users',
            icon: 'solar:users-group-two-rounded-line-duotone',
            onSelect: () => {
                open.value = false
            }
        },
        {
            label: 'Articles',
            to: '/settings/articles',
            icon: 'solar:layers-minimalistic-bold-duotone',
            onSelect: () => {
                open.value = false
            }
        },
        {
            label: 'Clients',
            to: '/settings/clients',
            icon: 'solar:users-group-two-rounded-bold-duotone',
            onSelect: () => {
                open.value = false
            }
        }
        ]
    }
    ]
]

const groups = computed(() => [{
    id: 'links',
    label: 'Go to',
    items: links.flat()
}, {
    id: 'code',
    label: 'Code',
    items: [{
        id: 'source',
        label: 'View page source',
        icon: 'i-simple-icons-github',
        to: `https://github.com/nuxt-ui-pro/dashboard/blob/main/app/pages${route.path === '/' ? '/index' : route.path}.vue`,
        target: '_blank'
    }]
}])

onMounted(async () => {
    const cookie = useCookie('cookie-consent')
    if (cookie.value === 'accepted') {
        return
    }
})
</script>

<template>
    <UDashboardGroup as="div">
        <UDashboardSearch :groups="groups" />

        <UDashboardSidebar v-model:open="open" :min-size="20" mode="modal" collapsible resizable
            class="bg-(--ui-bg-elevated)/25" :ui="{ footer: 'lg:border-t lg:border-(--ui-border)' }">
            <template #header="{ collapsed }">
                <TeamsMenu :collapsed="collapsed" />
            </template>

            <template #default="{ collapsed }">
                <UDashboardSearchButton :collapsed="collapsed" class="bg-transparent ring-(--ui-border)" />

                <UNavigationMenu highlight highlight-color="primary" :collapsed="collapsed" :items="links[0]"
                    orientation="vertical" />

                <UNavigationMenu :collapsed="collapsed" :items="links[1]" orientation="vertical" class="mt-auto" />
            </template>

            <template #footer="{ collapsed }">
                <UserMenu :collapsed="collapsed" />
            </template>
        </UDashboardSidebar>

        <slot />

        <NotificationsSlideover />
    </UDashboardGroup>
</template>
