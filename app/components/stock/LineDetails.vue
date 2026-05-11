<script setup lang="ts">
import type { STKLine, STKLineDetail } from '~/types'
import type { Row } from '@tanstack/table-core'
import type { TableColumn } from '@nuxt/ui'

const props = defineProps({
    open: { type: Boolean, required: true },
    line: { type: Object as PropType<STKLine | null>, required: true },
    readonly: { type: Boolean, default: false }
})
const emit = defineEmits(['update:open', 'refresh'])

const isOpen = computed({
    get: () => props.open,
    set: (value) => emit('update:open', value)
})

// 2. Services et composables
const supabase = useSupabaseClient()
const toast = useToast()

// 3. resolveComponent() — obligatoire avant tout usage dans h()
const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')

// 4. Refs d'état UI
const openAddModal = ref(false)

// 5. useDataTable
const {
    table,
    columnFilters,
    rowSelection,
    pagination,
    totalFilteredRows,
    currentPage,
    currentPageSize,
    setPage,
} = useDataTable({ pageSize: 5 })

// 6. Définition des colonnes
const columns: TableColumn<STKLineDetail>[] = [
    {
        accessorKey: 'numero_serie',
        header: () => h('div', { class: 'w-[150px]' }, 'Numéro de série'),
        cell: ({ row }) => h('p', { class: 'font-medium text-(--ui-text-highlighted)' }, row.original.numero_serie || 'N/A')
    },
    {
        accessorKey: 'statut',
        header: () => h('div', { class: 'w-[120px]' }, 'Statut'),
        cell: ({ row }) => h('p', { class: 'text-(--ui-text-muted)' }, row.original.statut)
    },
    ...((props.readonly)
        ? []
        : [{
            id: 'actions',
            header: () => h('div', { class: 'text-center w-[80px]' }, 'Actions'),
            cell: ({ row }: { row: Row<STKLineDetail> }) => h('div', { class: 'text-left' },
                h(UButton, {
                    icon: 'i-lucide-trash',
                    color: 'error',
                    variant: 'ghost',
                    async onClick() {
                        const { error } = await supabase.from('stk_trx_details').delete().eq('id', row.original.id)
                        if (error) {
                            toast.add({ title: 'Erreur', description: error.message, color: 'error' })
                        } else {
                            toast.add({ title: 'Supprimé', description: 'Élément supprimé', color: 'success' })
                            await refresh()
                            emit('refresh')
                        }
                    }
                })
            )
        }])
]

// 8. Chargement des données
const { data: details, pending, refresh } = await useAsyncData(
    `stk-trx-details-${props.line?.id}`,
    async () => {
        if (!props.line?.id) return []
        const { data, error } = await supabase
            .from('stk_trx_details')
            .select('*')
            .eq('line_id', props.line.id)
        if (error) throw error
        return data as STKLineDetail[]
    },
    { watch: [() => props.line?.id], immediate: true }
)
</script>

<template>
    <UModal v-model:open="isOpen" :title="`Détails - ${line?.article?.nom}`"
            description="Liste des numeros de serie" :ui="{ content: 'max-w-3xl' }">
        <template #body>
            <div class="space-y-4">
                <div v-if="!readonly" class="flex items-center justify-end">
                    <UButton label="Ajouter une serie" icon="i-lucide-plus" size="sm" color="primary"
                             @click="openAddModal = true" />
                </div>

                <UTable ref="table" v-model:column-filters="columnFilters" v-model:pagination="pagination"
                        :data="details || []" :columns="columns" :loading="pending" :ui="{
                            base: 'table-fixed border-separate border-spacing-0 border border-(--ui-border) rounded-t-lg w-full',
                            thead: '[&>tr]:bg-(--ui-bg-elevated)/50 [&>tr]:after:content-none',
                            tbody: '[&>tr]:last:[&>td]:border-b-0',
                            th: 'py-1 first:rounded-tl-[calc(var(--ui-radius)*2)] last:rounded-tr-[calc(var(--ui-radius)*2)] border-y border-(--ui-border) first:border-l last:border-r p-2',
                            td: 'border-b border-(--ui-border) p-2'
                        }" />

                <div v-if="details?.length" class="flex items-center justify-between gap-3 border-t border-(--ui-border) pt-4">
                    <div class="text-xs text-(--ui-text-muted)">
                        {{ details.length }} ligne(s) de détail.
                    </div>
                </div>
            </div>

            <!-- Modal Ajout -->
            <StockAddDetailModal v-model:open="openAddModal" :line-id="line?.id" @added="() => { refresh(); emit('refresh') }" />
        </template>
    </UModal>
</template>
