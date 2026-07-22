<template>
    <UDashboardPanel id="client-detail" as="div" :ui="{ body: 'p-4' }">
        <template #header>
            <UDashboardNavbar>
                <template #leading>
                    <UDashboardSidebarCollapse />
                    <UBreadcrumb
                        :items="[{ label: 'Home', to: '/' }, { label: 'Clients', to: '/clients' }, { label: `${route.params.id}`, to: '/settings/clients' + route.params.id }]" />
                </template>

                <template #right>
                    <UButton label="Edit" color="primary" variant="subtle" icon="i-lucide-pencil" />
                    <UButton label="Delete" color="error" variant="subtle" icon="i-lucide-trash" />
                </template>
            </UDashboardNavbar>
        </template>
        <template #body>
            <pre>{{ client }}</pre>
            <div class="grid grid-cols-4 gap-4">
                <div class="bg-red-500 h-20 flex flex-col justify-left items-left rounded-lg w-56 p-4">
                    <p>Nom</p>
                    <p>{{ client?.nom }}</p>
                </div>
                <div class="bg-teal-500 h-20 flex flex-col justify-left items-left rounded-lg w-56 p-4">
                    <h4>Nbre Patients</h4>
                    <p>10</p>
                </div>
                <div class="bg-red-300 h-20 flex flex-col justify-left items-left rounded-lg w-56 p-4">
                    <h4>Nbre Mutuelles</h4>
                    <p>10</p>
                </div>
                <div class="bg-blue-500 h-20 flex flex-col justify-left items-left rounded-lg w-56 p-4">
                    <h4>Nbre Factures</h4>
                    <p>10</p>
                </div>
                <div class="bg-green-500 h-20 flex flex-col justify-left items-left rounded-lg w-56 p-4">
                    <h4>Nbre Paiements</h4>
                    <p>10</p>
                </div>
                <div class="bg-purple-500 h-20 flex flex-col justify-left items-left rounded-lg w-56 p-4"></div>
                <div class="bg-purple-500 h-20 flex flex-col justify-left items-left rounded-lg w-56 p-4"></div>
                <div class="bg-purple-500 h-20 flex flex-col justify-left items-left rounded-lg w-56 p-4"></div>
            </div>
            <UTabs color="primary" variant="link" :items="items" class="w-full" :ui="{ list: 'mb-2' }">
                <template #content="{ item }">
                    <ClientsPatients v-if="item.value == 'client' && client" :organisation-id="route.params.id as string" />
                    <ClientsMutuelles v-else-if="item.value == 'mutuelle' && client" :organisation-id="route.params.id as string" />
                    <ClientsFactures v-else :organisation="route.params.id" />
                </template>
            </UTabs>
        </template>
    </UDashboardPanel>
</template>

<script setup lang="ts">
import type { TabsItem } from '@nuxt/ui'

definePageMeta({
    name: 'client-id',

})
useSeoMeta({
    title: 'Client - Wazi',
    description: 'Détails du client.',
})

const items = ref<TabsItem[]>([
    {
        label: 'Patients',
        icon: 'i-lucide-user',
        value: 'client'
    },
    {
        label: 'Factures',
        icon: 'i-lucide-lock',
        value: 'facture'
    },
    {
        label: 'Mutuelles',
        icon: 'ic:twotone-health-and-safety',
        value: 'mutuelle'
    }
])
const route = useRoute()
const { data: client, error } = await useAsyncData('client-' + route.params.id, async () => {
    const client = useSupabaseClient()
    const { data, error } = await client
        .from('clients')
        .select('*')
        .eq('id', route.params.id as any)
        .single()
    if (error) throw error
    return data
})


</script>
