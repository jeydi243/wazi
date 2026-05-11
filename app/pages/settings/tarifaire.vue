<template>
    <UDashboardPanel id="tarifaires" :ui="{ body: 'p-0' }">
        <template #header>
            <UDashboardNavbar title="Tarifaires">
                <template #leading>
                    <!-- <UDashboardSidebarCollapse /> -->
                </template>

                <template #right>
                    <div class="flex flex-wrap items-center justify-between gap-1.5">
                        <UInput v-model="searchInput" class="max-w-sm" icon="i-lucide-search"
                                placeholder="Rechercher un tarifaire..." />

                        <div class="flex flex-wrap items-center gap-1.5">
                            <USelect v-model="statusFilter" :items="[
                                         { label: 'Toutes', value: 'all' },
                                         { label: 'Subscribed', value: 'subscribed' },
                                         { label: 'Actif', value: 'actif' },
                                         { label: 'Bounced', value: 'bounced' }
                                     ]" :ui="{ trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200' }"
                                     placeholder="Filtrer par statut" class="min-w-28" />

                            <UDropdownMenu :items="columnDisplayItems" :content="{ align: 'end' }">
                                <UButton label="Affichage" color="neutral" variant="outline"
                                         trailing-icon="i-lucide-settings-2" />
                            </UDropdownMenu>
                        </div>
                    </div>
                    <TarifairesAddModal @tarifaire-added="refreshTarifaires" />
                </template>
            </UDashboardNavbar>
        </template>
        <template #body>
            <UTable ref="table" v-model:column-filters="columnFilters" v-model:column-visibility="columnVisibility"
                    v-model:row-selection="rowSelection" v-model:pagination="pagination"
                    :pagination-options="paginationOptions" class="shrink-0 m-2" :data="Tarifaires || []" :columns="columns"
                    :loading="pending" :ui="{
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
            <TarifairesDetails v-model:open="openDetailsTarifaire" :tarifaire="selectedTarifaire" />
        </template>
    </UDashboardPanel>
</template>

<script setup lang="ts">
import type { Row } from '@tanstack/table-core'
import type { TableColumn } from '@nuxt/ui'
import type { Tarifaire } from '~/types'

// 1. SEO
useHead({
    title: 'Tarifaires - Paramètres',
    meta: [
        { name: 'description', content: 'Gérer les tarifaires.' }
    ]
})

// 2. Services et composables
const supabase = useSupabaseClient()
const toast = useToast()

const {
    table,
    UButton,
    UDropdownMenu,
    UBadge,
    UCheckbox,
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
    setPage
} = useDataTable({ filterColumnId: 'nom', pageSize: 10 })

// 3. UI State
const openDetailsTarifaire = ref(false)
const selectedTarifaire = ref<Tarifaire | null>(null)
const searchInput = ref('')

// 4. Column display items
const columnDisplayItems = buildColumnDisplayItems(['details', 'code', 'nom', 'description', 'organisation', 'actions'])

// 5. Search Logic
const debouncedSearch = useDebounceFn((val: string) => {
    table.value?.tableApi?.getColumn('nom')?.setFilterValue(val)
}, 300)

watch(searchInput, (val) => {
    debouncedSearch(val)
})

// 6. Definition des colonnes
const columns: TableColumn<Tarifaire>[] = [
    {
        id: 'details',
        header: () => h('div', { class: 'flex items-center justify-center' }, 'Détails'),
        cell: ({ row }) => h('div', { class: 'flex items-center justify-center' }, h(UButton, {
            color: 'neutral',
            variant: 'ghost',
            icon: 'solar:pen-new-square-line-duotone',
            class: '-mx-2.5',
            onClick: () => {
                selectedTarifaire.value = row.original
                openDetailsTarifaire.value = true
            }
        })
        ),
    },
    {
        accessorKey: 'code',
        header: 'Code',
        cell: ({ row }) => h('p', { class: 'font-medium text-(--ui-text-highlighted)' }, row.original.code)
    },
    {
        accessorKey: 'nom',
        header: 'Nom',
        cell: ({ row }) => h('p', { class: 'font-medium text-(--ui-text-highlighted)' }, row.original.nom)
    },
    {
        accessorKey: 'description',
        header: 'Description',
        cell: ({ row }) => h('p', { class: 'text-(--ui-text-muted)' }, row.original.description)
    },
    {
        accessorKey: 'organisation',
        header: 'Organisation',
        cell: ({ row }) => h('p', undefined, row.original.organisation?.nom || 'N/A')
    },
    {
        header: () => h('div', { class: 'text-center' }, 'Actions'),
        id: 'actions',
        cell: ({ row }) => h('div', { class: 'text-center' },
            h(UDropdownMenu, {
                content: { align: 'end' },
                children: getRowItems(row)
            }, () => h(UButton, {
                icon: 'i-lucide-ellipsis-vertical',
                color: 'neutral',
                variant: 'ghost',
                class: 'ml-auto'
            }))
        )
    }
]

// 7. Fonctions utilitaires
function getRowItems(row: Row<Tarifaire>) {
    return [
        { type: 'label', label: 'Actions' },
        {
            label: 'Copier ID Tarifaire',
            icon: 'i-lucide-copy',
            onSelect() {
                navigator.clipboard.writeText(row.original.id.toString())
                toast.add({
                    title: 'Copié !',
                    description: 'ID Tarifaire copié dans le presse-papiers',
                    color: 'success'
                })
            }
        },
        { type: 'separator' },
        {
            label: 'Détails',
            icon: 'i-lucide-maximize-2',
            onSelect() {
                selectedTarifaire.value = row.original
                openDetailsTarifaire.value = true
            }
        },
        { type: 'separator' },
        {
            label: 'Supprimer',
            icon: 'i-lucide-trash',
            color: 'error',
            async onSelect() {
                const { error } = await supabase.from('tarifaires').delete().eq('id', row.original.id)
                if (error) {
                    toast.add({ title: 'Erreur', description: error.message, color: 'error' })
                } else {
                    toast.add({ title: 'Succès', description: 'Tarifaire supprimé avec succès', color: 'success' })
                    await refreshTarifaires()
                }
            }
        }
    ]
}

// 8. Chargement des données
const { data: Tarifaires, pending, refresh: refreshTarifaires } = await useAsyncData('tarifaires', async () => {
    const { data, error } = await supabase
        .from('tarifaires')
        .select('*, organisation:organisations!inner(*)')
    if (error) throw error
    return data
})
</script>
