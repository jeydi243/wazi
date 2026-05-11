<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { upperFirst } from 'scule'
import { getPaginationRowModel, type Row } from '@tanstack/table-core'
import { breakpointsTailwind, useBreakpoints } from '@vueuse/core'
import type { Patient } from '~/types'

definePageMeta({
    pageTransition: false
})

useHead({
    title: 'Patients',
    meta: [
        { name: 'description', content: 'Manage your patients.' }
    ]
})

const supabase = useSupabaseClient()
const toast = useToast()

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
    selectedRowCount,
    totalFilteredRows,
    currentPage,
    currentPageSize,
    setPage,
    setStatusFilter
} = useDataTable({ filterColumnId: 'nom', pageSize: 10 })

const breakpoints = useBreakpoints(breakpointsTailwind)
const isMobile = breakpoints.smaller('lg')

watch(isMobile, (mobile) => {
    columnVisibility.value = {
        mobile_card: mobile,
        select: !mobile,
        details: !mobile,
        nom: !mobile,
        prenom: !mobile,
        date_naissance: !mobile,
        sexe: !mobile,
        status: !mobile,
        actions: !mobile,
    }
}, { immediate: true })

const UAvatar = resolveComponent('UAvatar')

// Fetch patients data from supabase
const { data: patients, error, refresh: refreshPatients } = await useAsyncData('patients', async () => {
    const { data, error } = await supabase.from('patients').select();
    if (error) {
        throw error;
    }
    return data;
});


function getRowItems(row: Row<Patient>) {
    return [
        {
            type: 'label' as const,
            label: 'Actions'
        },
        {
            label: 'Copy patient ID',
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
            type: 'separator' as const
        },
        {
            label: 'View patient details',
            icon: 'i-lucide-list'
        },
        {
            label: 'View patient payments',
            icon: 'i-lucide-wallet'
        },
        {
            type: 'separator' as const
        },
        {
            label: 'Delete patient',
            icon: 'i-lucide-trash',
            color: 'error' as const,
            onSelect() {
                toast.add({
                    title: 'Patient deleted',
                    description: 'The patient has been deleted.'
                })
            }
        }
    ]
}

const columns: TableColumn<Patient>[] = [
    {
        id: 'mobile_card',
        header: 'Patients',
        cell: ({ row }) => {
            const color = {
                subscribed: 'success' as const,
                unsubscribed: 'error' as const,
                bounced: 'warning' as const
            }[row.original.status] || 'neutral'

            return h('div', { class: 'flex flex-col gap-3 p-3 border border-(--ui-border) rounded-xl bg-(--ui-bg-elevated)/50' }, [
                h('div', { class: 'flex items-center justify-between' }, [
                    h('div', { class: 'flex items-center gap-3' }, [
                        h(UAvatar, {
                            src: row.original.avatar ?? undefined,
                            size: 'md',
                            alt: row.original.nom
                        }),
                        h('div', undefined, [
                            h('p', { class: 'font-bold text-(--ui-text-highlighted)' }, `${row.original.nom} ${row.original.postnom}`),
                            h('p', { class: 'text-xs text-(--ui-text-muted)' }, row.original.mrn)
                        ])
                    ]),
                    h(UDropdownMenu, { content: { align: 'end' }, items: getRowItems(row) },
                        () => h(UButton, { icon: 'i-lucide-ellipsis-vertical', color: 'neutral', variant: 'ghost' })
                    )
                ]),
                h('div', { class: 'grid grid-cols-2 gap-2 text-xs' }, [
                    h('div', undefined, [
                        h('p', { class: 'text-(--ui-text-muted) mb-1' }, 'Prénom & Genre'),
                        h('div', { class: 'flex gap-2 items-center' }, [
                            h('span', undefined, row.original.prenom),
                            h(UBadge, { variant: 'subtle', size: 'sm', leadingIcon: row.original.sexe === 'M' ? 'i-lucide-user' : 'i-lucide-user-round' }, () => upperFirst(row.original.sexe))
                        ])
                    ]),
                    h('div', { class: 'text-right' }, [
                        h('p', { class: 'text-(--ui-text-muted) mb-1' }, 'Statut'),
                        h(UBadge, { variant: 'subtle', size: 'sm', color }, () => row.original.status)
                    ])
                ]),
                h('div', { class: 'flex items-center justify-between text-xs border-t border-(--ui-border) pt-2' }, [
                    h('p', { class: 'text-(--ui-text-muted)' }, 'Né(e) le ' + row.original.date_naissance),
                    h(UButton, {
                        label: 'Détails',
                        color: 'primary',
                        variant: 'ghost',
                        size: 'sm',
                        icon: 'i-lucide-eye',
                        onClick: () => { navigateTo(`/patients/${row.original.id}`) }
                    })
                ])
            ])
        }
    },
    {
        id: 'select',
        header: ({ table }) =>
            h(UCheckbox, {
                'modelValue': table.getIsSomePageRowsSelected()
                    ? 'indeterminate'
                    : table.getIsAllPageRowsSelected(),
                'onUpdate:modelValue': (value: any) =>
                    table.toggleAllPageRowsSelected(!!value),
                'ariaLabel': 'Select all'
            }),
        cell: ({ row }) =>
            h(UCheckbox, {
                'modelValue': row.getIsSelected(),
                'onUpdate:modelValue': (value: any) => row.toggleSelected(!!value),
                'ariaLabel': 'Select row'
            })
    },
    {
        id: 'details',
        header: ({ column }) => h('div', { class: 'text-center' }, [h(UButton, {
            color: 'neutral',
            variant: 'ghost',
            label: 'Détails',
            icon: column.getIsSorted() ? (column.getIsSorted() === 'asc' ? 'i-lucide-arrow-up-narrow-wide' : 'i-lucide-arrow-down-wide-narrow') : 'i-lucide-arrow-up-down',
            class: '-mx-2.5',
            onClick: () => column.toggleSorting(column.getIsSorted() === 'asc')
        })]),
        cell: ({ row }) => h('div', { class: 'text-center' }, [h(UButton, {
            color: 'primary',
            variant: 'ghost',
            icon: 'i-lucide-eye',
            onClick: () => { navigateTo(`/patients/${row.original.id}`) }
        })]),
    },
    {
        accessorKey: 'nom',
        header: 'Nom',
        cell: ({ row }) => {
            return h('div', { class: 'flex items-center gap-3' }, [
                h(UAvatar, {
                    src: row.original.avatar ?? undefined,
                    size: 'lg'
                }),
                h('div', undefined, [
                    h('p', { class: 'font-medium text-(--ui-text-highlighted)' }, row.original.nom + ' ' + row.original.postnom),
                    h('p', { class: '' }, `${row.original.mrn}`)
                ])
            ])
        }
    },
    {
        accessorKey: 'prenom',
        header: 'Prenom'
    },
    {
        accessorKey: 'date_naissance',
        header: 'Date de naissance'
    },
    {
        accessorKey: 'sexe',
        header: ({ column }) => {
            const isSorted = column.getIsSorted()

            return h(UButton, {
                color: 'neutral',
                variant: 'ghost',
                label: 'Genre',
                icon: isSorted
                    ? isSorted === 'asc'
                        ? 'i-lucide-arrow-up-narrow-wide'
                        : 'i-lucide-arrow-down-wide-narrow'
                    : 'i-lucide-arrow-up-down',
                class: '-mx-2.5',
                onClick: () => column.toggleSorting(column.getIsSorted() === 'asc')
            })
        },
        cell: ({ row }) => h('div', { class: 'text-center' }, [h('p', { class: 'capitalize' }, row.original.sexe)])
    },
    {
        accessorKey: 'status',
        header: 'Status',
        filterFn: 'equals',
        cell: ({ row }) => {
            const color = {
                actif: 'success' as const,
                inactif: 'error' as const,
                bounced: 'warning' as const
            }[row.original.status]

            return h(UBadge, { class: 'capitalize', variant: 'subtle', color }, () =>
                row.original.status
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

// Les watches et l'état de pagination sont maintenant gérés par useDataTable
</script>

<template>
    <UDashboardPanel id="patients" as="div" :ui-pro="{ body: 'p-5', root: 'p-5' }">
        <template #header>
            <UDashboardNavbar>
                <template #leading>
                    <UDashboardSidebarCollapse />
                    <UBreadcrumb :items="[{ label: 'Home', to: '/' }, { label: 'Patients', to: '/patients' }]" />
                </template>

                <template #right>
                    <PatientsAddModal @patient-added="refreshPatients()" />
                </template>
            </UDashboardNavbar>
        </template>

        <template #body>
            <div class="flex flex-wrap items-center justify-between gap-1.5">
                <UInput :model-value="(table?.tableApi?.getColumn('nom')?.getFilterValue() as string)" class="max-w-sm"
                        icon="i-lucide-search" placeholder="Filter noms..."
                        @update:model-value="table?.tableApi?.getColumn('nom')?.setFilterValue($event)" />

                <div class="flex flex-wrap items-center gap-1.5">
                    <PatientsDeleteModal :count="table?.tableApi?.getFilteredSelectedRowModel().rows.length">
                        <UButton v-if="table?.tableApi?.getFilteredSelectedRowModel().rows.length" label="Delete"
                                 color="error" variant="subtle" icon="i-lucide-trash">
                            <template #trailing>
                                <UKbd>
                                    {{ table?.tableApi?.getFilteredSelectedRowModel().rows.length }}
                                </UKbd>
                            </template>
                        </UButton>
                    </PatientsDeleteModal>

                    <USelect v-model="statusFilter" :items="[
                                 { label: 'All', value: 'all' },
                                 { label: 'Subscribed', value: 'subscribed' },
                                 { label: 'Unsubscribed', value: 'unsubscribed' },
                                 { label: 'Bounced', value: 'bounced' }
                             ]" :ui="{ trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200' }"
                             placeholder="Filter status" class="min-w-28"
                             @update:model-value="setStatusFilter('status', $event)" />
                    <UDropdownMenu :items="columnDisplayItems" :content="{ align: 'end' }">
                        <UButton label="Display" color="neutral" variant="outline"
                                 trailing-icon="i-lucide-settings-2" />
                    </UDropdownMenu>
                </div>
            </div>

            <UTable ref="table" v-model:column-filters="columnFilters" v-model:column-visibility="columnVisibility"
                    v-model:row-selection="rowSelection" v-model:pagination="pagination"
                    :pagination-options="paginationOptions" class="shrink-0" :data="patients || []" :columns="columns" :ui="{
                        base: 'table-fixed border-separate border-spacing-0 w-full',
                        thead: '[&>tr]:bg-(--ui-bg-elevated)/50 [&>tr]:after:content-none hidden lg:table-header-group',
                        tbody: '[&>tr]:last:[&>td]:border-b-0',
                        th: 'py-1 first:rounded-tl-[calc(var(--ui-radius)*2)] last:rounded-tr-[calc(var(--ui-radius)*2)] border-y border-(--ui-border) first:border-l last:border-r',
                        td: 'border-b border-(--ui-border) p-0 lg:p-2'
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
