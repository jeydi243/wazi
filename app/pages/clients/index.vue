<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { upperFirst } from 'scule'
import { getPaginationRowModel, type Row } from '@tanstack/table-core'
import type { Organisation, Patient, User } from '~/types'

definePageMeta({
    pageTransition: false
})

useHead({
    title: 'Partenaires',
    meta: [
        { name: 'description', content: 'Manage your partenaires.' }
    ]
})

const table = useTemplateRef('table')
const toast = useToast()
const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')
const supabase = useSupabaseClient()
const UCheckbox = resolveComponent('UCheckbox')
const rowSelection = ref()
const UDropdownMenu = resolveComponent('UDropdownMenu')
const columnVisibility = ref()

const columnFilters = ref([{
    id: 'nom',
    value: ''
}])

// use useasyncData to fetch partenaires data from supabase
const { data: partenaires, error, refresh: refreshPartenaires } = await useAsyncData('organisations', async () => {
    const { data, error } = await supabase.from('organisations').select('id, nom, description, lookups!inner(*)').eq('lookups.nom', 'Entreprise')
    if (error) {
        throw error;
    }
    console.log({ data })
    return data;
});


function getRowItems(row: Row<Organisation>) {
    return [
        {
            type: 'label',
            label: 'Actions'
        },
        {
            label: 'Copy partenaire ID',
            icon: 'i-lucide-copy',
            onSelect() {
                navigator.clipboard.writeText(row.original.id.toString())
                toast.add({
                    title: 'Copied to clipboard',
                    description: 'Patient ID copied to clipboard'
                })
            }
        },
        {
            type: 'separator'
        },
        {
            label: 'View partenaire details',
            icon: 'i-lucide-list'
        },
        {
            label: 'View partenaire payments',
            icon: 'i-lucide-wallet'
        },
        {
            type: 'separator'
        },
        {
            label: 'Delete partenaire',
            icon: 'i-lucide-trash',
            color: 'error',
            onSelect() {
                toast.add({
                    title: 'Patient deleted',
                    description: 'The partenaire has been deleted.'
                })
            }
        }
    ]
}

const columns: TableColumn<Organisation>[] = [
    {
        id: 'select',
        header: ({ table }) =>
            h(UCheckbox, {
                'modelValue': table.getIsSomePageRowsSelected()
                    ? 'indeterminate'
                    : table.getIsAllPageRowsSelected(),
                'onUpdate:modelValue': (value: boolean | 'indeterminate') =>
                    table.toggleAllPageRowsSelected(!!value),
                'ariaLabel': 'Select all'
            }),
        cell: ({ row }) =>
            h(UCheckbox, {
                'modelValue': row.getIsSelected(),
                'onUpdate:modelValue': (value: boolean | 'indeterminate') => row.toggleSelected(!!value),
                'ariaLabel': 'Select row'
            })
    },
    {
        id: 'details',
        header: 'Details',
        cell: ({ row }) => h(UButton, {
            color: 'primary',
            variant: 'ghost',
            icon: 'i-lucide-eye',
            to: { name: 'partenaire-id', params: { id: row.original.id } }
        }),
    },
    {
        accessorKey: 'nom',
        header: 'Nom',
        cell: ({ row }) => {
            return h('div', { class: 'flex items-center gap-3' }, [
                // h(UAvatar, {
                //     ...row.original.avatar,
                //     size: 'lg'
                // }),
                h('div', undefined, [
                    h('p', { class: 'font-medium text-(--ui-text-highlighted)' }, row.original.nom)
                ])
            ])
        }
    },
    {
        accessorKey: 'description',
        header: 'Description',
        cell: ({ row }) => row.original.description
    },
    {
        accessorKey: 'status',
        header: 'Status',
        filterFn: 'equals',
        cell: ({ row }) => {
            const colorMap: Record<string, string> = {
                subscribed: 'success',
                unsubscribed: 'error',
                bounced: 'warning'
            }
            const color = colorMap[row.original.status || ''] || 'neutral'

            return h(UBadge, { class: 'capitalize', variant: 'subtle', color }, () =>
                row.original.status || 'Unknown'
            )
        }
    },
    {
        id: 'actions',
        cell: ({ row }) => {
            return h(
                'div',
                { class: 'text-right' },
                h(
                    UDropdownMenu,
                    {
                        content: {
                            align: 'end'
                        },
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

const statusFilter = ref('all')

watch(() => statusFilter.value, (newVal) => {
    if (!table?.value?.tableApi) return

    const statusColumn = table.value.tableApi.getColumn('status')
    if (!statusColumn) return

    if (newVal === 'all') {
        statusColumn.setFilterValue(undefined)
    } else {
        statusColumn.setFilterValue(newVal)
    }
})

const pagination = ref({
    pageIndex: 0,
    pageSize: 10
})
</script>

<template>
    <UDashboardPanel id="partenaires" as="div" :ui="{ body: 'p-5', root: 'p-5' }">
        <template #header>
            <UDashboardNavbar>
                <template #leading>
                    <UDashboardSidebarCollapse />
                    <UBreadcrumb :items="[{ label: 'Home', to: '/' }, { label: 'Partenaires', to: '/partenaires' }]" />
                </template>

                <template #right>
                    <PartenairesAddModal @partenaire-added="refreshPartenaires()" />
                </template>
            </UDashboardNavbar>
        </template>

        <template #body>
            <div class="flex flex-wrap items-center justify-between gap-1.5">
                <UInput :model-value="(table?.tableApi?.getColumn('nom')?.getFilterValue() as string)" class="max-w-sm"
                        icon="i-lucide-search" placeholder="Filter noms..."
                        @update:model-value="table?.tableApi?.getColumn('nom')?.setFilterValue($event)" />

                <div class="flex flex-wrap items-center gap-1.5">
                    <PartenairesDeleteModal :count="table?.tableApi?.getFilteredSelectedRowModel().rows.length">
                        <UButton v-if="table?.tableApi?.getFilteredSelectedRowModel().rows.length" label="Delete"
                                 color="error" variant="subtle" icon="i-lucide-trash">
                            <template #trailing>
                                <UKbd>
                                    {{ table?.tableApi?.getFilteredSelectedRowModel().rows.length }}
                                </UKbd>
                            </template>
                        </UButton>
                    </PartenairesDeleteModal>

                    <USelect v-model="statusFilter" :items="[
                                 { label: 'All', value: 'all' },
                                 { label: 'Subscribed', value: 'subscribed' },
                                 { label: 'Unsubscribed', value: 'unsubscribed' },
                                 { label: 'Bounced', value: 'bounced' }
                             ]" :ui="{ trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200' }"
                             placeholder="Filter status" class="min-w-28" />
                    <UDropdownMenu :items="table?.tableApi
                        ?.getAllColumns()
                        .filter((column) => column.getCanHide())
                        .map((column) => ({
                            label: upperFirst(column.id),
                            type: 'checkbox' as const,
                            checked: column.getIsVisible(),
                            onUpdateChecked(checked: boolean) {
                                table?.tableApi?.getColumn(column.id)?.toggleVisibility(!!checked)
                            },
                            onSelect(e?: Event) {
                                e?.preventDefault()
                            }
                        }))
                    " :content="{ align: 'end' }">
                        <UButton label="Display" color="neutral" variant="outline"
                                 trailing-icon="i-lucide-settings-2" />
                    </UDropdownMenu>
                </div>
            </div>

            <UTable ref="table" v-model:column-filters="columnFilters" v-model:column-visibility="columnVisibility"
                    v-model:row-selection="rowSelection" v-model:pagination="pagination" :pagination-options="{
                        getPaginationRowModel: getPaginationRowModel()
                    }" class="shrink-0" :data="partenaires" :columns="columns" :ui="{
                        base: 'table-fixed border-separate border-spacing-0',
                        thead: '[&>tr]:bg-(--ui-bg-elevated)/50 [&>tr]:after:content-none',
                        tbody: '[&>tr]:last:[&>td]:border-b-0',
                        th: 'py-1 first:rounded-tl-[calc(var(--ui-radius)*2)] last:rounded-tr-[calc(var(--ui-radius)*2)] border-y border-(--ui-border) first:border-l last:border-r',
                        td: 'border-b border-(--ui-border) py-0 m-1'
                    }" />

            <div class="flex items-center justify-between gap-3 border-t border-(--ui-border) pt-4 mt-auto">
                <div class="text-sm text-(--ui-text-muted)">
                    {{ table?.tableApi?.getFilteredSelectedRowModel().rows.length || 0 }} of
                    {{ table?.tableApi?.getFilteredRowModel().rows.length || 0 }} row(s) selected.
                </div>

                <div class="flex items-center gap-1.5">
                    <UPagination :default-page="(table?.tableApi?.getState().pagination.pageIndex || 0) + 1"
                                 :items-per-page="table?.tableApi?.getState().pagination.pageSize"
                                 :total="table?.tableApi?.getFilteredRowModel().rows.length"
                                 @update:page="(p) => table?.tableApi?.setPageIndex(p - 1)" />
                </div>
            </div>
        </template>
    </UDashboardPanel>
</template>
