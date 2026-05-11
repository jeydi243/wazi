<template>
    <div>
        <!-- :default-size="25" :min-size="20" :max-size="25" resizable  -->
        <UDashboardPanel id="inbox-70" :ui-pro="{ body: 'p-0' }">
            <template #header>
                <UDashboardNavbar title="Users">
                    <template #leading>
                        <!-- <UDashboardSidebarCollapse /> -->
                    </template>

                    <template #right>
                        <div class="flex flex-wrap items-center justify-between gap-1.5">
                            <UInput v-model="searchInput"
                                    class="max-w-sm" icon="i-lucide-search" placeholder="Rechercher un utilisateur (email)..." />

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
                        <UsersAddModal />
                    </template>
                </UDashboardNavbar>
            </template>
            <template #body>
                <UTable ref="table" v-model:column-filters="columnFilters" v-model:column-visibility="columnVisibility"
                        v-model:row-selection="rowSelection" v-model:pagination="pagination" :pagination-options="{
                            getPaginationRowModel: getPaginationRowModel()
                        }" class="shrink-0 m-2" :data="Users || []" :columns="columns" :loading="status === 'pending'" :ui="{
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
        <UsersDetails v-model:open="openDetailsUser" :user="selectedUser" />
    </div>
</template>
<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { upperFirst } from 'scule'
import * as z from 'zod'
import { getPaginationRowModel, type Row } from '@tanstack/table-core'
import type { Profil } from '~/types'

useHead({
    title: 'Users - Settings',
    meta: [
        { name: 'description', content: 'Manage users.' }
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
const openDetailsUser = ref(false)
const selectedUser = ref<Profil | null>(null)
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
const columns: TableColumn<Profil>[] = [
    {
        id: 'details',
        header: 'Details',
        cell: ({ row }) => h(UButton, {
            color: 'primary',
            variant: 'ghost',
            icon: 'i-lucide-eye',
            onClick: () => {
                selectedUser.value = row.original;
                openDetailsUser.value = !openDetailsUser.value;
                // console.log(row.original, openDetailsUser.value)
            }
        }),
    },
    {
        accessorKey: 'email',
        header: 'Email',
        cell: ({ row }) => {
            return h('div', { class: 'flex items-center gap-3' }, [

                h('div', undefined, [
                    h('p', { class: 'font-medium text-(--ui-text-highlighted)' }, row.original.email),
                ])
            ])
        }
    },
    {
        accessorKey: 'prenom',
        header: 'Prenom',
        cell: ({ row }) => {
            return h('div', { class: 'flex items-center gap-3' }, [

                h('div', undefined, [
                    h('p', { class: 'font-medium text-(--ui-text-highlighted)' }, row.original.prenom),
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

function getRowItems(row: Row<Profil>) {
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
                openDetailsUser.value = !openDetailsUser.value
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


const { data: Users, error } = await supabase.from('profils').select()

</script>
