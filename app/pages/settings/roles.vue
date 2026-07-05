<template>
    <div class="bg-(--ui-bg-elevated)/50">
        <UDashboardPanel id="inbox-70" :ui-pro="{ body: 'p-0' }">
            <template #header>
                <UDashboardNavbar title="Roles">
                    <template #leading>
                        <!-- <UDashboardSidebarCollapse /> -->
                    </template>

                    <template #right>
                        <div class="flex flex-wrap items-center justify-between gap-1.5">
                            <UInput v-model="searchInput" class="max-w-sm" icon="i-lucide-search"
                                placeholder="Rechercher un utilisateur (email)..." />

                            <div class="flex flex-wrap items-center gap-1.5">
                                <!-- <CustomersDeleteModal
                                    :count="table?.tableApi?.getFilteredSelectedRowModel().rows.length">
                                    <UButton v-if="table?.tableApi?.getFilteredSelectedRowModel().rows.length"
                                        label="Delete" color="error" variant="subtle" icon="i-lucide-trash">
                                        <template #trailing>
                                            <UKbd>
                                                {{ table?.tableApi?.getFilteredSelectedRowModel().rows.length }}
                                            </UKbd>
                                        </template>
</UButton>
</CustomersDeleteModal> -->

                                <USelect v-model="statusFilter" :items="[
                                    { label: 'All', value: 'all' },
                                    { label: 'Subscribed', value: 'subscribed' },
                                    { label: 'Actif', value: 'actif' },
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
                        <RolesAddModal />
                    </template>
                </UDashboardNavbar>
            </template>
            <template #body>
                <UTable ref="table" v-model:column-filters="columnFilters" v-model:column-visibility="columnVisibility"
                    v-model:row-selection="rowSelection" v-model:pagination="pagination" :pagination-options="{
                        getPaginationRowModel: getPaginationRowModel()
                    }" class="shrink-0 m-2 bg-white dark:bg-(--ui-bg)" :data="Roles || []" :columns="columns" :loading="status === 'pending'" :ui="{
                        base: 'table-fixed border-separate border-spacing-0 border border-(--ui-border) rounded-t-lg',
                        thead: '[&>tr]:bg-(--ui-bg-elevated)/50 [&>tr]:after:content-none',
                        tbody: '[&>tr]:last:[&>td]:border-b-0',
                        th: 'py-1 first:rounded-tl-[calc(var(--ui-radius)*2)] last:rounded-tr-[calc(var(--ui-radius)*2)] border-y border-(--ui-border) first:border-l last:border-r',
                        td: 'border-b border-(--ui-border) p-2'
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

        <RolesDetails v-model:open="openDetailsRole" :role="selectedRole" />
    </div>
</template>
<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { upperFirst } from 'scule'
import * as z from 'zod'
import { getPaginationRowModel, type Row } from '@tanstack/table-core'
import type { Profil, Role } from '~/types'

useHead({
    title: 'Roles - Settings',
    meta: [
        { name: 'description', content: 'Manage Roles.' }
    ]
})

const supabase = useSupabaseClient()
const table = useTemplateRef('table')
const status = ref('success')
const statusFilter = ref('all')
const columnFilters = ref([{
    id: 'email',
    value: ''
}])

const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')
const columnVisibility = ref()
const openDetailsRole = ref(false)
const selectedRole = ref<Role | null>(null)
const rowSelection = ref({ 2: true })
const toast = useToast()
const pagination = ref({
    pageIndex: 0,
    pageSize: 10
})

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
        header: 'Details',
        cell: ({ row }) => h(UButton, {
            color: 'primary',
            variant: 'ghost',
            icon: 'i-lucide-eye',
            onClick: () => {
                selectedRole.value = row.original;
                openDetailsRole.value = !openDetailsRole.value;
                // console.log(row.original, openDetailsRole.value)
            }
        }),
    },
    {
        accessorKey: 'nom',
        header: 'Nom',
        cell: ({ row }) => {
            return h('div', { class: 'flex items-center gap-3' }, [

                h('div', undefined, [
                    h('p', { class: 'font-medium text-(--ui-text-highlighted)' }, row.original.nom),
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
        accessorKey: 'nom',
        header: 'Nom',
        cell: ({ row }) => {
            return h('div', { class: 'flex items-center gap-3' }, [

                h('div', undefined, [
                    h('p', { class: 'font-medium text-(--ui-text-highlighted)' }, row.original.nom),
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

function getRowItems(row: Row<Role>) {
    return [
        {
            type: 'label',
            label: 'Actions'
        },
        {
            label: 'Copie ID User',
            icon: 'i-lucide-copy',
            onSelect() {
                copy(row.original.id.toString())
                toast.add({
                    title: 'Copié !',
                    description: 'ID de l\'utilisateur copié dans le presse-papiers'
                })
            }
        },
        {
            type: 'separator'
        },
        {
            label: 'Details',
            icon: 'material-symbols:open-in-full-rounded',
            onSelect() {
                openDetailsRole.value = !openDetailsRole.value
            }
        },
        {
            label: 'View customer payments',
            icon: 'i-lucide-wallet'
        },
        {
            type: 'separator'
        },
        {
            label: 'Delete classe',
            icon: 'i-lucide-trash',
            color: 'error',
            onSelect() {
                toast.add({
                    title: 'Customer deleted',
                    description: 'The customer has been deleted.'
                })
            }
        }
    ];
}


const { data: Roles, error } = await supabase.from('roles').select()

</script>
