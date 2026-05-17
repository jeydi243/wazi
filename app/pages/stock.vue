<script setup lang="ts">
useHead({
    title: 'stock - Wazi',
    meta: [
        { name: 'description', content: 'Manage your stock.' }
    ]
})
const links = [[{
    label: 'Stock',
    icon: 'i-lucide-user',
    to: '/stock',
    exact: true
},
{
    label: 'Transfert de stock',
    icon: 'i-lucide-users',
    to: '/stock/transfert-stock'
},
{
    label: 'Reception externe',
    icon: 'i-lucide-users',
    to: '/stock/reception-externe'
},
{
    label: 'Reception Interne',
    icon: 'octicon:organization-16',
    to: '/stock/reception-interne'
}

]]
</script>

<template>
    <UDashboardPanel id="stock" as="div" :ui="{ body: 'p-0', root: 'p-0 m-0' }" class="p-0">
        <template #header>
            <UDashboardToolbar>
                <UDashboardSidebarCollapse />
                <!-- NOTE: The `-mx-1` class is used to align with the `DashboardSidebarCollapse` button here. -->
                <UNavigationMenu :items="links" class="-mx-1 flex-1" />
            </UDashboardToolbar>
        </template>

        <template #body>
            <NuxtPage />
        </template>
    </UDashboardPanel>
</template>
