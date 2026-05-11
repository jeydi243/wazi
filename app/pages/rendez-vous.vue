<template>
    <UDashboardPanel id="rendez-vous" as="div" :ui-pro="{ body: 'p-0' }">
        <template #header>
            <UDashboardNavbar title="Rendez-vous">
                <template #leading>
                    <!-- <UDashboardSidebarCollapse /> -->
                </template>

                <template #right>
                    <div class="flex flex-wrap items-center justify-between gap-1.5">
                        <UInput v-model="searchInput" class="max-w-sm" icon="i-lucide-search"
                            placeholder="Rechercher un patient..." />

                        <div class="flex flex-wrap items-center gap-1.5">
                            <USelect v-model="statusFilter" :items="[
                                { label: 'Toutes', value: 'all' },
                                { label: 'Confirmé', value: 'confirme' },
                                { label: 'En attente', value: 'attente' },
                                { label: 'Annulé', value: 'annule' }
                            ]"
                                :ui="{ trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200' }"
                                placeholder="Filtrer par statut" class="min-w-28" />

                            <UDropdownMenu :items="columnDisplayItems" :content="{ align: 'end' }">
                                <UButton label="Affichage" color="neutral" variant="outline"
                                    trailing-icon="i-lucide-settings-2" />
                            </UDropdownMenu>
                        </div>
                    </div>
                    <RdvAddModal @rdv-added="refreshListeRendezVous" />
                </template>
            </UDashboardNavbar>
        </template>

        <template #body>
            <UTable ref="table" v-model:column-filters="columnFilters" v-model:column-visibility="columnVisibility"
                v-model:row-selection="rowSelection" v-model:pagination="pagination"
                :pagination-options="paginationOptions" class="shrink-0 m-2" :data="ListeRendezVous || []"
                :columns="columns" :loading="pending" :ui="{
                    base: 'table-fixed border-separate border-spacing-0',
                    thead: '[&>tr]:bg-(--ui-bg-elevated)/50 [&>tr]:after:content-none',
                    tbody: '[&>tr]:last:[&>td]:border-b-0',
                    th: 'py-1 first:rounded-tl-[calc(var(--ui-radius)*2)] last:rounded-tr-[calc(var(--ui-radius)*2)] border-y border-(--ui-border) first:border-l last:border-r',
                    td: 'border-b border-(--ui-border) p-2'
                }" />

            <div class="flex items-center justify-between gap-3 border-t border-(--ui-border) pt-4 mt-auto">
                <div class="text-sm text-(--ui-text-muted)">
                    {{ selectedRowCount }} sur {{ totalFilteredRows }} ligne(s) sélectionnée(s).
                </div>

                <div class="flex items-center gap-1.5">
                    <UPagination :default-page="currentPage" :items-per-page="currentPageSize"
                        :total="totalFilteredRows" @update:page="setPage" />
                </div>
            </div>
        </template>
    </UDashboardPanel>
</template>

<script setup lang="ts">
import type { Row } from '@tanstack/table-core'
import type { TableColumn } from '@nuxt/ui'
import type { RendezVous } from '~/types'

// 1. SEO
definePageMeta({
    pageTransition: false
})

useHead({
    title: 'Rendez-vous - Wazi',
    meta: [
        { name: 'description', content: 'Gérer les rendez-vous.' }
    ]
})

// 2. Services et composables
const supabase = useSupabaseClient()
const toast = useToast()

// 3. Composants (fournis par useDataTable pour les render functions)
const searchInput = ref('')

const {
    table,
    UButton,
    UBadge,
    UDropdownMenu,
    columnFilters,
    columnVisibility,
    rowSelection,
    pagination,
    paginationOptions,
    statusFilter,
    buildColumnDisplayItems,
    selectedRowCount,
    totalFilteredRows,
    currentPage,
    currentPageSize,
    setPage,
} = useDataTable({ filterColumnId: 'nom', pageSize: 10 })

// IDs des colonnes cachables — liste STATIQUE, sans jamais toucher à tableApi
const columnDisplayItems = buildColumnDisplayItems(['consultation', 'nom', 'date_rdv', 'sexe', 'statut', 'actions'])

// Synchronisation de la recherche globale sans passer par tableApi pour éviter les boucles de rendu
watch(searchInput, (val) => {
    const filter = columnFilters.value.find(f => f.id === 'nom')
    if (filter) {
        filter.value = val
    } else {
        columnFilters.value.push({ id: 'nom', value: val })
    }
})


// 6. Définition des colonnes (array statique TypeScript)
function getRowItems(row: Row<RendezVous>) {
    return [
        { type: 'label' as const, label: 'Actions' },
        {
            label: 'Copier ID RDV',
            icon: 'i-lucide-copy',
            onSelect() {
                navigator.clipboard.writeText(row.original.id.toString())
                toast.add({ title: 'Copié !', description: 'ID du rendez-vous copié.' })
            }
        },
        { type: 'separator' as const },
        { label: 'Détails patient', icon: 'i-lucide-user' },
        { label: 'Paiements', icon: 'i-lucide-wallet' },
        { type: 'separator' as const },
        {
            label: 'Supprimer',
            icon: 'i-lucide-trash',
            color: 'error' as const,
            onSelect() {
                toast.add({ title: 'Suppression', description: 'Action non implémentée.', color: 'warning' })
            }
        }
    ]
}

const columns: TableColumn<RendezVous>[] = [
    {
        id: 'consultation',
        header: 'Action',
        cell: ({ row }) => h(UButton, {
            color: 'primary',
            variant: 'subtle',
            size: 'xs',
            label: 'Consulter',
            icon: 'i-lucide-calendar-search',
            to: `/rendez-vous/${row.original.id}`
        }),
    },
    {
        id: 'nom',
        header: 'Patient',
        accessorFn: (row) => `${row.patient?.nom} ${row.patient?.postnom} ${row.patient?.prenom}`,
        cell: ({ row }) => h('div', { class: 'flex items-center gap-3' }, [
            h('div', undefined, [
                h('p', { class: 'font-medium text-(--ui-text-highlighted)' }, row.getValue('nom')),
                h('p', { class: 'text-xs text-(--ui-text-muted)' }, row.original.patient?.mrn)
            ])
        ])
    },
    {
        accessorKey: 'date_rdv', // Assumed correct from the select query
        header: 'Date RDV',
        cell: ({ row }) => {
            const date = row.original.date_rdv ? new Date(row.original.date_rdv).toLocaleDateString('fr-FR') : 'N/A'
            return h('p', { class: 'text-(--ui-text-highlighted)' }, date)
        }
    },
    {
        id: 'sexe',
        header: 'Sexe',
        cell: ({ row }) => h('p', { class: 'capitalize' }, row.original.patient?.sexe)
    },
    {
        accessorKey: 'statut',
        header: 'Statut',
        filterFn: 'equals',
        cell: ({ row }) => {
            const statusStr = row.original?.statut || 'attente'
            const color = {
                confirme: 'success' as const,
                attente: 'warning' as const,
                annule: 'error' as const
            }[statusStr] || 'neutral'

            return h(UBadge, { class: 'capitalize', variant: 'subtle', color }, () => statusStr)
        }
    },
    {
        header: () => h('div', { class: 'text-center' }, 'Actions'),
        id: 'actions',
        cell: ({ row }) => h('div', { class: 'text-center' },
            h(UDropdownMenu, { content: { align: 'end' }, items: getRowItems(row) },
                () => h(UButton, { icon: 'i-lucide-ellipsis-vertical', color: 'neutral', variant: 'ghost', class: 'ml-auto' })
            )
        )
    }
]

const { data: ListeRendezVous, pending, refresh: refreshListeRendezVous } = await useAsyncData<RendezVous[]>('rdv-list', async () => {
    const { data, error } = await supabase
        .from('rdv')
        .select(`
            id, 
            date_rdv, 
            statut, 
            patient:patients!inner(id, nom, prenom, postnom, mrn, sexe), 
            organisation:organisations!inner(id, nom)
        `)
    if (error) throw error
    return data as unknown as RendezVous[]
})
</script>

<style scoped></style>