<script setup lang="ts">
import { sub } from 'date-fns'
import type { Period, Range } from '~/types'

const { isNotificationsSlideoverOpen } = useDashboard()

const items = [[{
    label: 'New mail',
    icon: 'i-lucide-send',
    to: '/inbox'
}, {
    label: 'Nouveau partenaire',
    icon: 'i-lucide-user-plus',
    to: '/partenaires'
}]]

const range = shallowRef<Range>({
    start: sub(new Date(), { days: 14 }),
    end: new Date()
})
const period = ref<Period>('daily')
</script>

<template>
    <UDashboardPanel id="home" as="div" :ui-pro="{ body: 'py-5' }">
        <template #header>
            <UDashboardNavbar title="Home" :ui-pro="{ right: 'gap-3' }">
                <template #leading>
                    <UDashboardSidebarCollapse />
                </template>

                <template #right>
                    <UTooltip text="Notifications" :shortcuts="['N']">
                        <UButton color="neutral" variant="ghost" square @click="isNotificationsSlideoverOpen = true">
                            <UChip color="error" inset>
                                <UIcon name="i-lucide-bell" class="size-5 shrink-0" />
                            </UChip>
                        </UButton>
                    </UTooltip>

                    <UDropdownMenu :items="items">
                        <UButton icon="i-lucide-plus" size="md" class="rounded-full" />
                    </UDropdownMenu>
                </template>
            </UDashboardNavbar>

            <UDashboardToolbar>
                <template #left>
                    This default Home component
                </template>
            </UDashboardToolbar>
        </template>

        <template #body>
            <div class="p-3">
                <HomeStats :period="period" :range="range" />
                <!-- <HomeSales :period="period" :range="range" /> -->
            </div>
        </template>
    </UDashboardPanel>
</template>
