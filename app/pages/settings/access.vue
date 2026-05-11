<template>
    <div>
        <UDashboardPanel id="inbox-900" :ui-pro="{ body: 'p-0' }">
            <template #header>
                <UDashboardNavbar title="Roles">
                    <template #leading>
                        <!-- <UDashboardSidebarCollapse /> -->
                    </template>

                    <template #right>
                        <div class="flex flex-wrap items-center justify-between gap-1.5">
                            <UInput v-model="searchInput" class="max-w-sm" icon="i-lucide-search"
                                    placeholder="Rechercher un article..." />
                        </div>
                        <RolesAddModal @role-added="refreshRoles" />
                    </template>
                </UDashboardNavbar>
            </template>
            <template #body>
                <UTable ref="table" v-model:column-filters="columnFilters" v-model:column-visibility="columnVisibility"
                        v-model:row-selection="rowSelection" v-model:pagination="pagination"
                        :pagination-options="paginationOptions" class="shrink-0 m-2" :data="Roles || []" :columns="columns"
                        :loading="pending" :ui="{
                            base: 'table-fixed border-separate border-spacing-0 border border-(--ui-border) rounded-lg',
                            thead: '[&>tr]:bg-(--ui-bg-elevated)/50 [&>tr]:after:content-none',
                            tbody: '[&>tr]:last:[&>td]:border-b-0 ',
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
        <RolesDetails v-model:open="openDetailsAffectation" :role="selectedRole" />
        <!-- <RolesAffectations :role="selectedRole" v-model:open="openDetailsAffectation" /> -->
    </div>
</template>
<script setup lang="ts">
import type { Row } from '@tanstack/table-core'
import type { TableColumn } from '@nuxt/ui'
import type { Role } from '~/types'

useHead({
    title: 'Roles et Acces',
    meta: [
        { name: 'description', content: 'Gérer les roles et acces.' }
    ]
})

const supabase = useSupabaseClient()
const { getLookupsById } = useParametresStore()
const toast = useToast()

// 3. resolveComponent() — obligatoire avant tout usage dans h()
const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')

// ✅ Utilisation du composable centralisé
const {
    table,
    columnFilters,
    columnVisibility,
    rowSelection,
    pagination,
    paginationOptions,
    selectedRowCount,
    totalFilteredRows,
    currentPage,
    currentPageSize,
    setPage
} = useDataTable({ filterColumnId: 'nom', pageSize: 10 })

const openDetailsRole = ref(false)
const openDetailsAffectation = ref(false)
const selectedRole = ref<Role | null>(null)

const { copy } = useClipboard()
const searchInput = ref('')

const debouncedSearch = useDebounceFn((val: string) => {
    table.value?.tableApi?.getColumn('nom')?.setFilterValue(val)
}, 300)

watch(searchInput, (val) => {
    debouncedSearch(val)
})

const columns: TableColumn<Role>[] = [
    {
        id: 'details',
        header: 'Détails',
        cell: ({ row }) => h(UButton, {
            color: 'primary',
            variant: 'ghost',
            icon: 'i-lucide-eye',
            onClick: () => {
                selectedRole.value = row.original
                openDetailsRole.value = !openDetailsRole.value
            }
        }),
    }, {
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
        accessorKey: 'entite',
        header: 'Entite',
        cell: ({ row }) => {
            return h('div', { class: 'flex items-center gap-3' }, [
                h('div', undefined, [
                    h('p', { class: 'font-medium text-(--ui-text-highlighted)' }, getLookupsById(row.original.entite)),
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
                        items: getRowItems(row)
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

function getRowItems(row: Row<Role>) {
    return [
        {
            type: 'label' as const,
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
            type: 'separator' as const
        },
        {
            label: 'Voir les détails',
            icon: 'material-symbols:open-in-full-rounded',
            onSelect() {
                selectedRole.value = row.original
                openDetailsRole.value = true
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
            type: 'separator' as const
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
                        title: 'Role supprimé',
                        description: `L'article "${row.original.nom}" a été supprimé.`,
                        color: 'success'
                    })
                    await refreshRoles()
                }
            }
        }
    ]
}

const { data: Roles, pending, refresh: refreshRoles } = await useAsyncData('roles', async () => {
    const { data, error } = await supabase.from('roles').select('*')
    if (error) {
        throw error
    }
    return data
})
</script>
