<template>
    <UDashboardPanel id="commandes" :ui-pro="{ body: 'p-0' }">
        <template #header>
            <UDashboardNavbar title="Commandes">
                <template #leading>
                    <!-- <UDashboardSidebarCollapse /> -->
                </template>

                <template #right>
                    <div class="flex flex-wrap items-center justify-between gap-1.5">
                        <UDropdownMenu :items="itemsOrganisationUser">
                            <UButton icon="i-lucide-plus" size="md" class="rounded-full" />
                        </UDropdownMenu>
                        <UInput v-model="searchInput" class="max-w-sm" icon="i-lucide-search"
                                placeholder="Rechercher une organisation..." />

                        <div class="flex flex-wrap items-center gap-1.5">
                            <USelect v-model="statusFilter" :items="[
                                         { label: 'Toutes', value: 'all' },
                                         { label: 'Subscribed', value: 'subscribed' },
                                         { label: 'Actif', value: 'actif' },
                                         { label: 'Bounced', value: 'bounced' }
                                     ]" :ui="{ trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200' }"
                                     placeholder="Filtrer par statut" class="min-w-28"
                                     @update:model-value="setStatusFilter('status', $event)" />

                            <UDropdownMenu :items="columnDisplayItems" :content="{ align: 'end' }">
                                <UButton label="Affichage" color="neutral" variant="outline"
                                         trailing-icon="i-lucide-settings-2" />
                            </UDropdownMenu>
                        </div>
                    </div>
                    <StockAddReception @reception-added="refreshSTKHeaders" />
                </template>
            </UDashboardNavbar>
        </template>
        <template #body>
            <UTable ref="table" v-model:column-filters="columnFilters" v-model:column-visibility="columnVisibility"
                    v-model:row-selection="rowSelection" v-model:pagination="pagination" empty="Aucune reception disponible"
                    :pagination-options="paginationOptions" class="shrink-0 m-2" :data="stk_trx_headers || []"
                    :columns="columns" :loading="pending" :ui="{
                        base: 'table-fixed border-separate border-spacing-0 border border-(--ui-border) rounded-lg',
                        thead: '[&>tr]:bg-(--ui-bg-elevated)/50 [&>tr]:after:content-none',
                        tbody: '[&>tr]:last:[&>td]:border-b-0',
                        th: 'py-1 first:rounded-tl-[calc(var(--ui-radius)*2)] last:rounded-tr-[calc(var(--ui-radius)*2)] border-y border-(--ui-border) first:border-l last:border-r pl-2',
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

    <STKHeadersDetails v-model:open="openSlideOver" :organisation="selectedSTKHeader" />
</template>

<script setup lang="ts">
import type { Row } from '@tanstack/table-core'
import type { TableColumn, DropdownMenuItem } from '@nuxt/ui'
import type { STKHeader } from '~/types'
import { storeToRefs } from 'pinia'

useHead({
    title: 'Commandes',
    meta: [
        { name: 'description', content: 'Gérer les commandes.' }
    ]
})
const itemsOrganisationUser = [[{
    label: 'New mail',
    icon: 'i-lucide-send',
    to: '/inbox'
}, {
    label: 'Nouveau partenaire',
    icon: 'i-lucide-user-plus',
    to: '/partenaires'
}]]
const supabase = useSupabaseClient()
const toast = useToast()
const parametresStore = useParametresStore()
const { lookups } = storeToRefs(parametresStore)

// Utilisation du composable centralisé
const {
    table,
    UButton,
    UBadge,
    UDropdownMenu,
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
    setPage,
    setStatusFilter
} = useDataTable({ filterColumnId: 'description', pageSize: 10 })

// IDs des colonnes cachables — liste STATIQUE, sans jamais toucher à tableApi
const columnDisplayItems = buildColumnDisplayItems(['select', 'details', 'code', 'nom', 'description', 'type', 'status', 'actions'])

const openSlideOver = ref(false)
const selectedSTKHeader = ref<STKHeader | null>(null)

const { copy } = useClipboard()
const searchInput = ref('')

const debouncedSearch = useDebounceFn((val: string) => {
    table.value?.tableApi?.getColumn('description')?.setFilterValue(val)
}, 300)

watch(searchInput, (val) => {
    debouncedSearch(val)
})

const columns: TableColumn<STKHeader>[] = [
    {
        id: 'select',
        header: ({ table }) =>
            h(UCheckbox as any, {
                "modelValue": table.getIsAllPageRowsSelected(),
                "indeterminate": table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected(),
                'onUpdate:modelValue': (value: any) => table.toggleAllPageRowsSelected(!!value),
                'aria-label': 'Tout sélectionner'
            }),
        cell: ({ row }) =>
            h('div', { class: 'flex items-center justify-left' }, h(UCheckbox as any, {
                "modelValue": row.getIsSelected(),
                'onUpdate:modelValue': (value: any) => row.toggleSelected(!!value),
                'aria-label': 'Sélectionner ligne'
            }))
    },
    {
        id: 'details',
        header: 'Détails',
        cell: ({ row }) => h(UButton, {
            color: 'neutral',
            variant: 'ghost',
            icon: 'i-lucide-maximize-2',
            class: '-mx-2.5',
            onClick: () => {
                selectedSTKHeader.value = row.original
                openSlideOver.value = true
            }
        }),
    },
    {
        accessorKey: 'in_organisation',
        header: 'Organisation de reception',
        cell: ({ row }) => h('p', { class: 'font-medium text-(--ui-text-highlighted)' }, row.original.in_organisation.nom)
    },
    {
        accessorKey: 'out_organisation',
        header: 'Organisation de provenance',
        cell: ({ row }) => h('p', { class: 'font-medium text-(--ui-text-highlighted)' }, row.original.out_organisation.nom)
    },
    {
        accessorKey: 'date_trx',
        header: ({ column }) => {
            const isSorted = column.getIsSorted()
            return h(UButton, {
                color: 'neutral',
                variant: 'ghost',
                label: 'Date de transaction',
                icon: isSorted
                    ? isSorted === 'asc'
                        ? 'i-lucide-arrow-up-narrow-wide'
                        : 'i-lucide-arrow-down-wide-narrow'
                    : 'i-lucide-arrow-up-down',
                class: '-mx-2.5',
                onClick: () => column.toggleSorting(column.getIsSorted() === 'asc')
            })
        }
    },
    {
        accessorKey: 'description',
        header: ({ column }) => {
            const isSorted = column.getIsSorted()
            return h(UButton, {
                color: 'neutral',
                variant: 'ghost',
                label: 'Description',
                icon: isSorted
                    ? isSorted === 'asc'
                        ? 'i-lucide-arrow-up-narrow-wide'
                        : 'i-lucide-arrow-down-wide-narrow'
                    : 'i-lucide-arrow-up-down',
                class: '-mx-2.5',
                onClick: () => column.toggleSorting(column.getIsSorted() === 'asc')
            })
        }
    },
    {
        id: 'type',
        header: 'Type',
        cell: ({ row }) => {
            const lookup = (row.original as any).lookup
            const lookupNom = Array.isArray(lookup) ? lookup[0]?.nom : lookup?.nom
            return lookupNom || lookups.value.find(l => l.id === (row.original as any).lookup_id)?.nom || 'N/A'
        }
    },
    {
        accessorKey: 'status',
        header: 'Statut',
        filterFn: 'equals',
        cell: ({ row }) => {
            const statusStr = row.original.statut || 'actif'
            const color = {
                subscribed: 'success' as const,
                actif: 'success' as const,
                unsubscribed: 'error' as const,
                bounced: 'warning' as const
            }[statusStr] || 'neutral'

            return h(UBadge, { class: 'capitalize', variant: 'subtle', color }, () => statusStr)
        }
    },
    {
        header: () => h('div', { class: 'text-center' }, 'Actions'),
        id: 'actions',
        cell: ({ row }) => {
            return h(
                'div',
                { class: 'text-center' },
                h(
                    UDropdownMenu,
                    {
                        content: { align: 'end' },
                        items: getRowItems(row)
                    },
                    () =>
                        h(UButton, {
                            icon: 'i-lucide-ellipsis-vertical',
                            color: 'neutral',
                            variant: 'ghost',
                            class: 'ml-auto'
                        })
                )
            )
        }
    }
]

function getRowItems(row: Row<STKHeader>): DropdownMenuItem[][] {
    return [[
        {
            type: 'label' as const,
            label: 'Actions'
        },
        {
            label: 'Copie ID STKHeader',
            icon: 'i-lucide-copy',
            onSelect() {
                copy(row.original.id.toString())
                toast.add({
                    title: 'Copié !',
                    description: 'ID copié dans le presse-papiers'
                })
            }
        },
        { type: 'separator' as const },
        {
            label: 'Détails',
            icon: 'i-lucide-maximize-2',
            onSelect() {
                selectedSTKHeader.value = row.original
                openSlideOver.value = true
            }
        },
        { type: 'separator' as const },
        {
            label: 'Supprimer',
            icon: 'i-lucide-trash',
            color: 'error' as const,
            onSelect() {
                toast.add({
                    title: 'Action non disponible',
                    description: 'La suppression sera implémentée prochainement...'
                })
            }
        }
    ]]
}

const { data: stk_trx_headers, pending, refresh: refreshSTKHeaders } = await useAsyncData('stk_trx_headers-list', async () => {
    const { data, error } = await supabase.from('stk_trx_headers').select('*')
    if (error) {
        throw error
    }
    return data
})
</script>
