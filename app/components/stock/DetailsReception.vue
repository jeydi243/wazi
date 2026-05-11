<script setup lang="ts">
import type { Row } from '@tanstack/table-core'
import type { TableColumn, DropdownMenuItem } from '@nuxt/ui'
import type { Article, STKHeader, STKLine } from '~/types'

const props = defineProps({
    open: { type: Boolean, required: true },
    stk_trx_header: { type: Object as PropType<STKHeader | null>, required: true }
})
const emit = defineEmits(['update:open', 'reception-finished'])

// 1. SEO
// (Skip SEO as it's a slideover component)

// 2. Services et composables
const supabase = useSupabaseClient()
const toast = useToast()

const isOpen = computed({
    get: () => props.open,
    set: (value) => emit('update:open', value)
})

// 3. resolveComponent() — obligatoire avant tout usage dans h()
const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')
const UDropdownMenu = resolveComponent('UDropdownMenu')
const UCheckbox = resolveComponent('UCheckbox')

// 4. Refs d'état UI
const openAddModal = ref(false)
const openLineDetails = ref(false)
const selectedLine = ref<STKLine | null>(null)
const isOpenAddLotNumbers = ref(false)
const openConfirmFinish = ref(false)
const finishing = ref(false)
const currentArticle = ref<Article | null>(null)
const currentLineID = ref<string | null>(null)

// 5. useDataTable
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
    setPage,
} = useDataTable({ pageSize: 5 })

// 6. Définition des colonnes
const columns: TableColumn<STKLine>[] = [
    {
        accessorKey: 'article_nom',
        header: () => h('div', { class: 'w-[250px]' }, 'Article'),
        cell: ({ row }) => h('div', { class: 'flex flex-col min-w-0' }, [
            h('p', { class: 'font-medium text-(--ui-text-highlighted) truncate' }, row.original.article?.nom || 'N/A'),
            h('p', { class: 'text-xs text-(--ui-text-muted) truncate' }, row.original.article?.code || '')
        ])
    },
    {
        accessorKey: 'prix_unitaire',
        header: () => h('div', { class: 'w-[120px]' }, 'Prix Unitaire'),
        cell: ({ row }) => h('p', { class: 'text-left truncate' }, `${row.original.prix_unitaire?.toLocaleString() || 0}`)
    },
    {
        accessorKey: 'quantite_trx',
        header: () => h('div', { class: 'w-[70px] text-center' }, 'Quantité'),
        cell: ({ row }) => h('p', { class: 'text-center' }, row.original.quantite_trx)
    },
    {
        accessorKey: 'numero_lot',
        header: () => h('div', { class: 'w-[120px]' }, 'N° Lot'),
        cell: ({ row }) => h('p', { class: 'text-left truncate' }, row.original.numero_lot || '-')
    },

    {
        id: 'total',
        header: () => h('div', { class: 'w-[140px]' }, 'Total'),
        cell: ({ row }) => {
            const total = (row.original.quantite_trx || 0) * (row.original.prix_unitaire || 0)
            return h('p', { class: 'text-left font-bold truncate' }, `${total.toLocaleString()}`)
        }
    },
    {
        id: 'details',
        header: () => h('div', { class: 'text-center w-[80px]' }, 'Détails'),
        cell: ({ row }) => h('div', { class: 'text-center' },
            h(UButton, {
                icon: 'i-lucide-eye',
                color: 'neutral',
                variant: 'ghost',
                onClick: () => {
                    selectedLine.value = row.original
                    openLineDetails.value = true
                }
            })
        )
    },
    ...((props.stk_trx_header?.statut === 'Terminé')
        ? []
        : [{
            id: 'actions',
            header: () => h('div', { class: 'text-center w-[80px]' }, 'Actions'),
            cell: ({ row }: { row: Row<STKLine> }) => h('div', { class: 'text-center' },
                h(UDropdownMenu, { content: { align: 'end' }, items: getRowItems(row) },
                    () => h(UButton, { icon: 'i-lucide-ellipsis-vertical', color: 'neutral', variant: 'ghost' })
                )
            )
        }])
]

// 7. Fonctions utilitaires
function getRowItems(row: Row<STKLine>): DropdownMenuItem[][] {
    return [[
        {
            type: 'label' as const,
            label: 'Ligne Actions'
        },
        {
            label: 'Supprimer',
            icon: 'i-lucide-trash',
            color: 'error' as const,
            async onSelect() {
                const { error } = await supabase.from('stk_trx_lines').delete().eq('id', (row.original as any).id)
                if (error) {
                    toast.add({ title: 'Erreur', description: error.message, color: 'error' })
                } else {
                    toast.add({ title: 'Supprimé', description: 'Ligne supprimée', color: 'success' })
                    await refresh()
                }
            }
        }
    ]]
}

async function finishReception() {
    if (!props.stk_trx_header?.id) return

    finishing.value = true
    const { data: dataRPC, error: errorRPC } = await supabase.rpc('stock_update', { p_stk_header_id: props.stk_trx_header.id })
    console.log('Données retournés par la fonction stock_update ', { dataRPC })

    if (errorRPC || dataRPC?.includes('ERREUR')) {
        toast.add({ title: 'Erreur', description: errorRPC?.message || '' + dataRPC, color: 'error' })
    } else {
        const { data: dataInsert, error: errorInsert } = await supabase
            .from('stk_trx_headers')
            .update({ statut: 'Terminé' } as never)
            .eq('id', props.stk_trx_header.id)
        if (errorInsert) {
            toast.add({ title: 'Erreur', description: errorInsert?.message, color: 'error' })
        } else {
            toast.add({ title: 'Succès', description: 'Réception terminée', color: 'success' })
            emit('reception-finished')
            openConfirmFinish.value = false
            isOpen.value = false
        }
    }




    finishing.value = false
}

// 8. Chargement des données — SEMPRE EN DERNIER
const { data: lines, pending, refresh } = await useLazyAsyncData(
    `stk_trx_lines-${props.stk_trx_header?.id}`,
    async () => {
        if (!props.stk_trx_header?.id) return []
        const { data, error } = await supabase
            .from('stk_trx_lines')
            .select('*, article:article_id(*)')
            .eq('header_id', props.stk_trx_header.id)
        if (error) throw error
        console.log(data)
        return data as STKLine[]
    },
    { watch: [() => props.stk_trx_header?.id], immediate: true }
)
</script>

<template>
    <USlideover v-model:open="isOpen" title="Détails de la Réception"
                :ui="{ content: 'max-w-4xl', footer: 'flex flex-row justify-end' }" inset>
        <template #body>
            <div v-if="stk_trx_header" class="space-y-6">
                <!-- Région Info Header -->
                <div
                    class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 border border-(--ui-border) rounded-xl bg-(--ui-bg-elevated)/50">
                    <div class="space-y-1">
                        <p class="text-xs text-(--ui-text-muted) uppercase font-semibold">Numéro Document</p>
                        <p class="font-bold text-(--ui-text-highlighted)">{{ stk_trx_header.numero_document }}</p>
                    </div>
                    <div class="space-y-1">
                        <p class="text-xs text-(--ui-text-muted) uppercase font-semibold">Date</p>
                        <p>{{ new Date(stk_trx_header.date_trx).toLocaleDateString() }}</p>
                    </div>
                    <div class="space-y-1">
                        <p class="text-xs text-(--ui-text-muted) uppercase font-semibold">Statut</p>
                        <UBadge
                            :color="stk_trx_header.statut === 'valide' ? 'success' : stk_trx_header.statut === 'actif' ? 'warning' : 'neutral'"
                            variant="subtle" class="capitalize">
                            {{ stk_trx_header.statut }}
                        </UBadge>
                    </div>
                    <div class="space-y-1">
                        <p class="text-xs text-(--ui-text-muted) uppercase font-semibold">Magasin</p>
                        <p>{{ (stk_trx_header.in_organisation as any)?.nom || 'N/A' }}</p>
                    </div>
                    <div v-if="stk_trx_header.fournisseur" class="space-y-1">
                        <p class="text-xs text-(--ui-text-muted) uppercase font-semibold">Fournisseur</p>
                        <p>{{ (stk_trx_header.fournisseur as any)?.nom || 'N/A' }}</p>
                    </div>
                    <div v-if="stk_trx_header.type" class="space-y-1">
                        <p class="text-xs text-(--ui-text-muted) uppercase font-semibold">Type</p>
                        <p>{{ stk_trx_header.type }}</p>
                    </div>
                </div>

                <!-- Section Lignes -->
                <div class="space-y-4">
                    <div class="flex items-center justify-between">
                        <h3 class="text-lg font-bold">Articles reçus</h3>
                        <UButton v-if="stk_trx_header.statut !== 'Terminé'" label="Ajouter une ligne"
                                 icon="i-lucide-plus" color="primary" @click="openAddModal = true" />
                    </div>

                    <UTable ref="table" v-model:column-filters="columnFilters"
                            v-model:column-visibility="columnVisibility" v-model:row-selection="rowSelection"
                            v-model:pagination="pagination" :pagination-options="paginationOptions" :data="lines || []"
                            :columns="columns" :loading="pending" :ui="{
                                base: 'table-fixed border-separate border-spacing-0 border border-(--ui-border) rounded-t-lg w-full',
                                thead: '[&>tr]:bg-(--ui-bg-elevated)/50 [&>tr]:after:content-none',
                                tbody: '[&>tr]:last:[&>td]:border-b-0',
                                th: 'py-1 first:rounded-tl-[calc(var(--ui-radius)*2)] last:rounded-tr-[calc(var(--ui-radius)*2)] border-y border-(--ui-border) first:border-l last:border-r p-2',
                                td: 'border-b border-(--ui-border) p-2'
                            }" />

                    <div class="flex items-center justify-between gap-3 border-t border-(--ui-border) pt-4">
                        <div class="text-sm text-(--ui-text-muted)">
                            {{ totalFilteredRows }} ligne(s) au total.
                        </div>

                        <div class="flex items-center gap-1.5">
                            <UPagination :default-page="currentPage" :items-per-page="currentPageSize"
                                         :total="totalFilteredRows" @update:page="setPage" />
                        </div>
                    </div>
                </div>
            </div>

            <!-- Modal Ajout Ligne -->
            <StockAddLineModal v-model:open="openAddModal" :header="stk_trx_header" @line-added="refresh" />
            <StockLineDetails v-model:open="openLineDetails" :line="selectedLine"
                              :readonly="stk_trx_header?.statut === 'Terminé'" @refresh="refresh" />
            <StockLotNumbersModal v-model:open="isOpenAddLotNumbers" :line-id="currentLineID"
                                  :article="currentArticle" />
        </template>
        <template #footer>
            <UButton v-if="stk_trx_header?.statut !== 'Terminé'" label="Terminer la réception" color="primary"
                     variant="subtle" @click="openConfirmFinish = true" />
        </template>
    </USlideover>

    <UModal v-model:open="openConfirmFinish" title="Terminer la réception"
            description="Êtes-vous sûr de vouloir terminer cette réception ? Cette action changera le statut en 'Terminé'.">
        <template #footer>
            <UButton label="Annuler" color="neutral" variant="ghost" @click="openConfirmFinish = false" />
            <UButton label="Terminer" color="primary" :loading="finishing" @click="finishReception" />
        </template>
    </UModal>
</template>