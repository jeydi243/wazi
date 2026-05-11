<template>
    <div>
        <UDashboardPanel id="inbox-900" :ui-pro="{ body: 'p-0' }">
            <template #header>
                <UDashboardNavbar title="Articles">
                    <template #leading>
                        <!-- <UDashboardSidebarCollapse /> -->
                    </template>

                    <template #right>
                        <div class="flex flex-wrap items-center justify-between gap-1.5">
                            <UInput v-model="searchInput" class="max-w-sm" icon="i-lucide-search"
                                    placeholder="Rechercher un article..." />
                        </div>
                        <ArticlesAddModal @article-added="refreshArticles" />
                    </template>
                </UDashboardNavbar>
            </template>
            <template #body>
                <UTable ref="table" v-model:column-filters="columnFilters" v-model:column-visibility="columnVisibility"
                        v-model:row-selection="rowSelection" v-model:pagination="pagination"
                        :pagination-options="paginationOptions" class="shrink-0 m-2" :data="Articles || []"
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
        <ArticlesDetails v-model:open="openDetailsArticle" :article="selectedArticle" />
        <!-- <ArticlesAffectations :article="selectedArticle" v-model:open="openDetailsAffectation" /> -->
    </div>
</template>
<script setup lang="ts">
import type { Row } from '@tanstack/table-core'
import type { TableColumn } from '@nuxt/ui'
import type { Article, Lookup } from '~/types'

useHead({
    title: 'Articles',
    meta: [
        { name: 'description', content: 'Gérer les articles de prestation.' }
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

const openDetailsArticle = ref(false)
const openDetailsAffectation = ref(false)
const selectedArticle = ref<Article | null>(null)

const { copy } = useClipboard()
const searchInput = ref('')

const debouncedSearch = useDebounceFn((val: string) => {
    table.value?.tableApi?.getColumn('nom')?.setFilterValue(val)
}, 300)

watch(searchInput, (val) => {
    debouncedSearch(val)
})

const uniqueLookups = computed(() => {
    const lookupsMap = new Map()
    Articles.value?.forEach((art: any) => {
        if (art.lookup) {
            lookupsMap.set(art.lookup.id, art.lookup.nom)
        }
    })
    return Array.from(lookupsMap.entries()).map(([id, nom]) => ({ id: id as string, nom: nom as string }))
})

const lookupFilterItems = computed(() => {
    const filter = columnFilters.value.find(f => f.id === 'lookup_id')
    const filterValue = (filter?.value as string[]) || []

    return uniqueLookups.value.map(lookup => ({
        label: lookup.nom,
        type: 'checkbox' as const,
        checked: filterValue.includes(lookup.id),
        onUpdateChecked(checked: boolean) {
            let next = [...filterValue]
            if (checked) {
                if (!next.includes(lookup.id)) next.push(lookup.id)
            } else {
                next = next.filter(id => id !== lookup.id)
            }

            const idx = columnFilters.value.findIndex(f => f.id === 'lookup_id')
            if (next.length) {
                if (idx > -1) {
                    columnFilters.value[idx] = { id: 'lookup_id', value: next }
                } else {
                    columnFilters.value.push({ id: 'lookup_id', value: next })
                }
            } else if (idx > -1) {
                columnFilters.value.splice(idx, 1)
            }
        },
        onSelect(e: Event) {
            e.preventDefault()
        }
    }))
})

const columns: TableColumn<Article>[] = [
    {
        id: 'details',
        header: 'Détails',
        cell: ({ row }) => h(UButton, {
            color: 'primary',
            variant: 'ghost',
            icon: 'i-lucide-eye',
            onClick: () => {
                selectedArticle.value = row.original
                openDetailsArticle.value = !openDetailsArticle.value
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
        accessorKey: 'lookup_id',
        header: ({ column }) => {
            const filterValue = column.getFilterValue() as string[]
            const isFiltered = filterValue?.length > 0
            return h('div', { class: 'flex items-center gap-1' }, [
                h('span', 'Type'),
                h(UDropdownMenu, {
                    items: lookupFilterItems.value,
                    content: { align: 'start' },
                    ui: { content: 'min-w-40' }
                }, () => h(UButton, {
                    icon: 'i-lucide-filter',
                    variant: 'ghost',
                    color: isFiltered ? 'primary' : 'neutral',
                    size: 'xs',
                    square: true,
                    class: '-my-1'
                }))
            ])
        },
        cell: ({ row }) => {
            return h('div', { class: 'flex items-center gap-3' }, [
                h('div', undefined, [
                    h('p', { class: 'font-medium text-(--ui-text-highlighted)' }, row.original.lookup.nom),
                ])
            ])
        },
        filterFn: (row, columnId, filterValue: string[]) => {
            if (!filterValue || filterValue.length === 0) return true
            return filterValue.includes(row.getValue(columnId))
        }
    },
    // unite de conso
    {
        accessorKey: 'unite_conso_id',
        header: 'Unité de conso',
        cell: ({ row }) => {
            return h('div', { class: 'flex items-center gap-3' }, [
                h('div', undefined, [
                    h('p', { class: 'font-medium text-(--ui-text-highlighted)' }, row.original.unite_conso?.nom),
                ])
            ])
        }
    },
    // unite de stock
    {
        accessorKey: 'unite_stock_id',
        header: 'Unité de stock',
        cell: ({ row }) => {
            return h('div', { class: 'flex items-center gap-3' }, [
                h('div', undefined, [
                    h('p', { class: 'font-medium text-(--ui-text-highlighted)' }, row.original.unite_stock?.nom),
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

function getRowItems(row: Row<Article>) {
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
                selectedArticle.value = row.original
                openDetailsArticle.value = true
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
                const { error } = await supabase.from('articles').delete().eq('id', row.original.id)
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
                    await refreshArticles()
                }
            }
        }
    ]
}

const { data: Articles, pending, refresh: refreshArticles } = await useLazyAsyncData('articles', async () => {
    const { data, error } = await supabase.from('articles').select('*, lookup:lookup_id(*), unite_conso:unite_conso_id(*), unite_stock:unite_stock_id(*)')
    if (error) {
        throw error
    }
    console.log('Data', data);
    return data
})
</script>
