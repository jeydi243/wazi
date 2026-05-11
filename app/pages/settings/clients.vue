<template>
    <div>
        <UDashboardPanel id="inbox-900" :ui-pro="{ body: 'p-0' }">
            <template #header>
                <UDashboardNavbar title="Fournisseurs">
                    <template #leading>
                        <!-- <UDashboardSidebarCollapse /> -->
                    </template>

                    <template #right>
                        <div class="flex flex-wrap items-center justify-between gap-1.5">
                            <UInput v-model="searchInput" class="max-w-sm" icon="i-lucide-search"
                                    placeholder="Rechercher un article..." />
                        </div>
                        <FournisseursAddModal @article-added="refreshFournisseurs" />
                    </template>
                </UDashboardNavbar>
            </template>
            <template #body>
                <UTable ref="table" v-model:column-filters="columnFilters" v-model:column-visibility="columnVisibility"
                        v-model:row-selection="rowSelection" v-model:pagination="pagination"
                        :pagination-options="paginationOptions" class="shrink-0 m-2" :data="Fournisseurs || []"
                        :columns="columns" :loading="pending" :ui="{
                            base: 'table-fixed border-separate border-spacing-0 border border-(--ui-border) rounded-xl',
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
        <FournisseursDetails v-model:open="openDetailsFournisseur" :fournisseur="selectedFournisseur" />
        <FournisseursAffectations v-model:open="openDetailsAffectation" :fournisseur="selectedFournisseur" />
    </div>
</template>
<script setup lang="ts">
import type { Row } from '@tanstack/table-core'
import type { TableColumn } from '@nuxt/ui'
import type { Fournisseur } from '~/types'

useHead({
    title: 'Fournisseurs',
    meta: [
        { name: 'description', content: 'Gérer les Fournisseurs' }
    ]
})

const supabase = useSupabaseClient()
const { getLookupsById } = useParametresStore()
const toast = useToast()

// ✅ Utilisation du composable centralisé
const {
    table,
    UButton,
    UDropdownMenu,
    columnFilters,
    columnVisibility,
    rowSelection,
    pagination,
    paginationOptions,
    statusFilter,
    selectedRowCount,
    totalFilteredRows,
    currentPage,
    currentPageSize,
    setPage
} = useDataTable({ filterColumnId: 'nom', pageSize: 10 })

const openDetailsFournisseur = ref(false)
const openDetailsAffectation = ref(false)
const selectedFournisseur = ref<Fournisseur | null>(null)

const { copy } = useClipboard()
const searchInput = ref('')

const debouncedSearch = useDebounceFn((val: string) => {
    table.value?.tableApi?.getColumn('nom')?.setFilterValue(val)
}, 300)

watch(searchInput, (val) => {
    debouncedSearch(val)
})

const columns: TableColumn<Fournisseur>[] = [
    {
        id: 'details',
        header: 'Détails',
        cell: ({ row }) => h(UButton, {
            color: 'primary',
            variant: 'ghost',
            icon: 'i-lucide-eye',
            onClick: () => {
                selectedFournisseur.value = row.original
                openDetailsFournisseur.value = !openDetailsFournisseur.value
            }
        }),
    },
    {
        accessorKey: 'nom',
        header: 'Nom',
        cell: ({ row }) => {
            return h('div', { class: 'flex items-center gap-3' }, [
                h('div', undefined, [
                    h('p', { class: 'font-medium text-(--ui-text-highlighted)' }, row.original?.nom),
                ])
            ])
        }
    },
    {
        accessorKey: 'code',
        header: 'Code',
        cell: ({ row }) => {
            return h('div', { class: 'flex items-center gap-3' }, [
                h('div', undefined, [
                    h('p', { class: 'font-medium text-(--ui-text-highlighted)' }, row.original.code),
                ])
            ])
        }
    },
    {
        accessorKey: 'description',
        header: 'Description',
        cell: ({ row }) => {
            return h('div', { class: 'flex items-center gap-3' }, [
                h('div', undefined, [
                    h('p', { class: 'font-medium text-(--ui-text-highlighted)' }, row.original.description),
                ])
            ])
        }
    },
    {
        accessorKey: 'type_id',
        header: 'Type',
        cell: ({ row }) => {
            return h('div', { class: 'flex items-center gap-3' }, [
                h('div', undefined, [
                    h('p', { class: 'font-medium text-(--ui-text-highlighted)' }, getLookupsById(row.original.type?.id)),
                ])
            ])
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
                        children: getRowItems(row)
                    },
                    () => h(UButton, {
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

function getRowItems(row: Row<Fournisseur>) {
    return [
        {
            type: 'label',
            label: 'Actions'
        },
        {
            label: 'Copier l\'ID',
            icon: 'i-lucide-copy',
            onSelect() {
                copy(row.original.id.toString())
                toast.add({
                    title: 'Copié',
                    description: `ID article #${row.original.id} copié dans le presse-papiers`
                })
            }
        },
        {
            type: 'separator'
        },
        {
            label: 'Voir les détails',
            icon: 'material-symbols:open-in-full-rounded',
            onSelect() {
                selectedFournisseur.value = row.original
                openDetailsFournisseur.value = true
            }
        },
        {
            label: 'Voir les affectations',
            icon: 'material-symbols-light:add-link',
            onSelect() {
                openDetailsAffectation.value = !openDetailsAffectation.value
            }
        },
        {
            type: 'separator'
        },
        {
            label: 'Supprimer l\'article',
            icon: 'i-lucide-trash',
            color: 'error',
            async onSelect() {
                const { error } = await supabase.from('Fournisseurs').delete().eq('id', row.original.id)
                if (error) {
                    toast.add({
                        title: 'Erreur',
                        description: `Impossible de supprimer l'article : ${error.message}`,
                        color: 'error'
                    })
                } else {
                    toast.add({
                        title: 'Article supprimé',
                        description: `L'article "${row.original.nom}" a été supprimé.`,
                        color: 'success'
                    })
                    await refreshFournisseurs()
                }
            }
        }
    ]
}

const { data: Fournisseurs, pending, refresh: refreshFournisseurs } = await useAsyncData('Fournisseurs', async () => {
    const { data, error } = await supabase.from('fournisseurs').select('*')
    if (error) {
        throw error
    }
    return data
})
</script>
