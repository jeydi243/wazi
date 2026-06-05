<template>
    <UDashboardPanel id="facturation" :ui-pro="{ body: 'p-5', header: 'p-0' }">
        <template #header>
            <UDashboardNavbar title="Facturation">
                <template #leading>
                    <!-- <UDashboardSidebarCollapse /> -->
                </template>

                <template #right>
                    <div class="flex flex-wrap items-center justify-between gap-1.5">
                        <UInput v-model="searchInput" class="max-w-sm" icon="i-lucide-search"
                            placeholder="Rechercher un document..." />

                        <div class="flex flex-wrap items-center gap-1.5">
                            <USelect v-model="statusFilter" :items="[
                                { label: 'Toutes', value: 'all' },
                                { label: 'En cours', value: 'en_cours' },
                                { label: 'Validé', value: 'valide' },
                                { label: 'Annulé', value: 'annule' }
                            ]" :ui="{ trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200' }"
                                placeholder="Statut" class="min-w-28"
                                @update:model-value="setStatusFilter('statut', $event)" />

                            <UDropdownMenu :items="columnDisplayItems" :content="{ align: 'end' }">
                                <UButton label="Affichage" color="neutral" variant="outline"
                                    trailing-icon="i-lucide-settings-2" />
                            </UDropdownMenu>
                        </div>
                    </div>
                    <FacturationAddModal v-model:open="openSlideOver" @facturation-added="refreshFactures" :header="selectedFacture" />
                </template>
            </UDashboardNavbar>
        </template>
        <template #body>
            <!-- <ClientOnly> -->
            <UTable ref="table" v-model:column-filters="columnFilters" v-model:column-visibility="columnVisibility"
                v-model:row-selection="rowSelection" v-model:pagination="pagination" empty="Aucune facture disponible"
                :pagination-options="paginationOptions" class="shrink-0 m-2" :data="factures" :columns="columns"
                :loading="pending" :ui="{
                    base: 'table-fixed border-separate border-spacing-0 border border-(--ui-border) rounded-t-lg w-full',
                    thead: '[&>tr]:bg-(--ui-bg-elevated)/50 [&>tr]:after:content-none',
                    tbody: '[&>tr]:last:[&>td]:border-b-0',
                    th: 'py-1 first:rounded-tl-[calc(var(--ui-radius)*2)] last:rounded-tr-[calc(var(--ui-radius)*2)] border-y border-(--ui-border) first:border-l last:border-r pl-2',
                    td: 'border-b border-(--ui-border) p-2'
                }" />
            <!-- </ClientOnly> -->
             
            <UModal v-model:open="openConfirmDelete" title="Confirmation de suppression"
                description="Êtes-vous sûr de vouloir supprimer cette réception ? Cette action est irréversible.">
                <template #footer>
                    <div class="flex justify-end gap-3">
                        <UButton label="Annuler" color="neutral" variant="ghost" @click="openConfirmDelete = false" />
                        <UButton label="Supprimer" color="error" @click="confirmDelete" />
                    </div>
                </template>
            </UModal>

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
import type { TableColumn, DropdownMenuItem } from '@nuxt/ui'
import type { Facture } from '~/types'

// 1. SEO
useHead({
    title: 'Facturation',
    meta: [
        { name: 'description', content: 'Gérer les facturations.' }
    ]
})

// 2. Services et composables
const supabase = useSupabaseClient()
const toast = useToast()
const { copy } = useClipboard()

// 3. resolveComponent() — obligatoire avant tout usage dans h()
const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')
const UDropdownMenu = resolveComponent('UDropdownMenu')
const UCheckbox = resolveComponent('UCheckbox')

// 4. Refs d'état UI
const openSlideOver = ref(false)
const openConfirmDelete = ref(false)
const selectedFacture = ref<Facture | null>(null)
const factureToDelete = ref<Facture | null>(null)
const searchInput = ref('')

// 5. useDataTable
const {
    table,
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
} = useDataTable({ filterColumnId: 'numero_document', pageSize: 100 })

// IDs des colonnes cachables
const columnDisplayItems = buildColumnDisplayItems(['select', 'details', 'numero_document', 'numero_commande', 'in_organisation', 'date_trx', 'statut', 'actions'])

// logic de recherche
const debouncedSearch = useDebounceFn((val: string) => {
    table.value?.tableApi?.getColumn('numero_document')?.setFilterValue(val)
}, 300)

watch(searchInput, (val) => {
    debouncedSearch(val)
})

// 6. Définition des colonnes
const columns: TableColumn<Facture>[] = [
    {
        id: 'details',
        header: 'Détails',
        cell: ({ row }) => h(UButton, {
            color: 'neutral',
            variant: 'ghost',
            icon: 'solar:pen-line-duotone',
            onClick: () => {
                selectedFacture.value = row.original
                openSlideOver.value = true
            }
        })
    },
    {
        accessorKey: 'client_id',
        header: 'Client',
        cell: ({ row }) => h('p', undefined, row.original.client.nom)
    }, {
        accessorKey: 'numero_facture',
        header: 'N° Facture',
        cell: ({ row }) => h('p', { class: 'font-medium' }, row.original.numero_facture)
    },
    {
        accessorKey: 'montant_ht',
        header: 'Montant HT',
        cell: ({ row }) => h('p', { class: 'text-(--ui-text-muted)' }, row.original.montant_ht)
    },
    {
        accessorKey: 'montant_tva',
        header: 'Montant TVA',
        cell: ({ row }) => h('p', { class: 'text-(--ui-text-muted)' }, row.original.montant_tva)
    },
    {
        accessorKey: 'montant_ttc',
        header: 'Montant TTC',
        cell: ({ row }) => h('p', { class: 'text-(--ui-text-muted)' }, row.original.montant_ttc)
    },
    


    {
        accessorKey: 'date_facture',
        header: 'Date',
        cell: ({ row }) => {
            const date = row.original.date_facture ? new Date(row.original.date_facture) : null
            return h('p', undefined, date ? date.toLocaleDateString('fr-FR') : 'N/A')
        }
    },
    {
        accessorKey: 'statut',
        header: 'Statut',
        filterFn: 'equals',
        cell: ({ row }) => {
            const statusStr = row.original.statut || 'actif'
            const color = {
                valide: 'warning' as const,
                actif: 'success' as const,
                Terminé: 'success' as const
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

// 7. Fonctions utilitaires
function getRowItems(row: Row<Facture>): DropdownMenuItem[][] {
    return [[
        {
            type: 'label' as const,
            label: 'Actions'
        },
        {
            label: 'Copie ID',
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
                selectedFacture.value = row.original
                openSlideOver.value = true
            }
        },
        { type: 'separator' as const },
        {
            label: 'Supprimer',
            icon: 'i-lucide-trash',
            color: 'error' as const,
            disabled: row.original.statut === 'Terminé',
            onSelect() {
                factureToDelete.value = row.original
                openConfirmDelete.value = true
            }
        }
    ]]
}

async function confirmDelete() {
    if (!factureToDelete.value) return

    const { error } = await supabase
        .from('factures')
        .delete()
        .eq('id', factureToDelete.value.id)

    if (error) {
        toast.add({
            title: 'Erreur',
            description: error.message,
            color: 'error'
        })
    } else {
        toast.add({
            title: 'Succès',
            description: 'Réception supprimée avec succès',
            color: 'success'
        })
        await refreshFactures()
    }
    openConfirmDelete.value = false
    // receptionToDelete.value = null
}

// 8. Chargement des données
const { data: factures, pending, refresh: refreshFactures } = await useLazyAsyncData('factures_list',
    async () => {
        const { data, error } = await supabase
            .from('invoices')
            .select('*, client:client_id(*)')
        if (error) {
            throw error
        }
        return data as Facture[]
    })

// Écouter les changements en temps réel
onMounted(() => {
    const channel = supabase.channel('factures_realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'factures' }, () => {
            refreshFactures()
        })
        .subscribe()

    onUnmounted(() => {
        supabase.removeChannel(channel)
    })
})
</script>
