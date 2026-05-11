<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { Organisation } from '~/types'

const props = defineProps<{
    open: boolean
    organisation: Organisation | null
}>()

const emit = defineEmits(['update:open', 'select-organisation'])

const isOpen = computed({
    get: () => props.open,
    set: (value) => emit('update:open', value)
})

const items = [
    {
        label: 'Services',
        icon: 'i-lucide-building',
        slot: 'services'
    },
    {
        label: 'Emplacements',
        icon: 'i-lucide-building',
        slot: 'emplacements'
    }
]

const supabase = useSupabaseClient()
const toast = useToast()

const { data: services, pending, refresh } = await useAsyncData<Organisation[]>(
    () => `services-${props.organisation?.id}`,
    async () => {
        if (!props.organisation?.id) return []
        const { data, error } = await supabase
            .from('organisations')
            .select('*')
            .eq('organisation_parent_id', props.organisation.id)
        if (error) {
            toast.add({ title: 'Erreur', description: error.message, color: 'error' })
            return []
        }
        return data as Organisation[]
    },
    { watch: [() => props.organisation?.id, () => isOpen.value], immediate: true }
)
const { data: emplacements, pending: pendingEmplacements, refresh: refreshEmplacements } = await useAsyncData<Organisation[]>(
    () => `emplacements-${props.organisation?.id}`,
    async () => {
        if (!props.organisation?.id) return []
        const { data, error } = await supabase
            .from('organisations')
            .select('*, lookup:lookup_id!inner(*)')
            .eq('organisation_parent_id', props.organisation.id)
            .eq('lookup.description', 'Emplacement')
        if (error) {
            toast.add({ title: 'Erreur', description: error.message, color: 'error' })
            return []
        }
        return data as Organisation[]
    },
    { watch: [() => props.organisation?.id, () => isOpen.value], immediate: true }
)

const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')

const columns: TableColumn<Organisation>[] = [
    {
        accessorKey: 'code',
        header: 'Code',
        cell: ({ row }) => h('p', { class: 'font-mono text-(--ui-text-muted)' }, row.original.code || 'N/A')
    },
    {
        accessorKey: 'nom',
        header: 'Nom',
        cell: ({ row }) => h('p', { class: 'font-medium text-(--ui-text-highlighted)' }, row.original.nom)
    },
    {
        accessorKey: 'status',
        header: 'Statut',
        cell: ({ row }) => {
            const statusStr = row.original.status || 'actif'
            const statusColors: Record<string, 'success' | 'error' | 'warning' | 'neutral'> = {
                actif: 'success',
                unsubscribed: 'error',
                bounced: 'warning'
            }
            const color = statusColors[statusStr] || 'neutral'
            return h(UBadge, { variant: 'subtle', color, class: 'capitalize' }, () => statusStr)
        }
    },
    {
        id: 'actions',
        header: '',
        cell: ({ row }) => h('div', { class: 'flex justify-end' }, h(UButton, {
            color: 'neutral',
            variant: 'ghost',
            icon: 'i-lucide-arrow-right',
            size: 'xs',
            onClick: () => {
                // If the user wants to navigate to this organization's details
                // This would require more logic, but for now we could emit something or update props
                emit('select-organisation', row.original)
            }
        }))
    }
]
</script>

<template>
    <USlideover v-model:open="isOpen" title="Détails de l'organisation" :ui="{ content: 'max-w-2xl' }">
        <template #content>
            <div class="p-4 flex flex-col h-full gap-4">
                <div>
                    <p v-if="props.organisation" class="text-xl font-semibold text-(--ui-text-highlighted)">
                        {{
                            props.organisation.nom }}
                    </p>
                    <p class="text-sm text-(--ui-text-muted) flex items-center gap-2 mt-1">
                        <span class="font-mono bg-(--ui-bg-elevated) px-1.5 py-0.5 rounded">{{ props.organisation?.code
                            || 'N/A' }}</span>
                        <UBadge v-if="props.organisation?.status" :label="props.organisation.status" variant="subtle"
                                class="capitalize" />
                    </p>
                </div>

                <div v-if="props.organisation" class="flex-1 overflow-hidden">
                    <UTabs :items="items" class="h-full flex flex-col" variant="link">
                        <template #infos>
                            <div class="space-y-4 pt-4">
                                <div>
                                    <p class="text-sm font-medium text-(--ui-text-muted) mb-1">Description</p>
                                    <p class="text-sm text-(--ui-text-highlighted)">
                                        {{ props.organisation.description ||
                                            'Aucune description.' }}
                                    </p>
                                </div>
                            </div>
                        </template>

                        <template #services>
                            <div class="pt-4 h-full space-y-4 flex flex-col">
                                <div class="flex justify-end">
                                    <OrganisationsAddServiceModal :parent="props.organisation" @service-added="refresh" />
                                </div>
                                <UTable :data="services || []" :columns="columns" :loading="pending"
                                        class="border border-(--ui-border) rounded-md overflow-hidden flex-1" :ui="{
                                            base: 'table-fixed border-separate border-spacing-0 border border-(--ui-border) rounded-t-lg',
                                            thead: '[&>tr]:bg-(--ui-bg-elevated)/50 [&>tr]:after:content-none',
                                            tbody: '[&>tr]:last:[&>td]:border-b-0',
                                            th: 'py-1 first:rounded-tl-[calc(var(--ui-radius)*2)] last:rounded-tr-[calc(var(--ui-radius)*2)] border-y border-(--ui-border) first:border-l last:border-r',
                                            td: 'border-b border-(--ui-border) p-2'
                                        }">
                                    <template #empty-state>
                                        <div
                                            class="flex flex-col items-center justify-center py-6 text-(--ui-text-muted) text-sm">
                                            <p>Aucun service trouvé pour cette organisation.</p>
                                        </div>
                                    </template>
                                </UTable>
                            </div>
                        </template>
                        <template #emplacements>
                            <div class="pt-4 h-full space-y-4 flex flex-col">
                                <div class="flex justify-end">
                                    <OrganisationsAddEmplacementModal :parent="props.organisation" @emplacement-added="refresh" />
                                </div>
                                <UTable :data="emplacements || []" :columns="columns" :loading="pending"
                                        class="border border-(--ui-border) rounded-md overflow-hidden flex-1" :ui="{
                                            base: 'table-fixed border-separate border-spacing-0 border border-(--ui-border) rounded-t-lg',
                                            thead: '[&>tr]:bg-(--ui-bg-elevated)/50 [&>tr]:after:content-none',
                                            tbody: '[&>tr]:last:[&>td]:border-b-0',
                                            th: 'py-1 first:rounded-tl-[calc(var(--ui-radius)*2)] last:rounded-tr-[calc(var(--ui-radius)*2)] border-y border-(--ui-border) first:border-l last:border-r',
                                            td: 'border-b border-(--ui-border) p-2'
                                        }">
                                    <template #empty-state>
                                        <div
                                            class="flex flex-col items-center justify-center py-6 text-(--ui-text-muted) text-sm">
                                            <p>Aucun service trouvé pour cette organisation.</p>
                                        </div>
                                    </template>
                                </UTable>
                            </div>
                        </template>
                    </UTabs>
                </div>
            </div>
        </template>
    </USlideover>
</template>
