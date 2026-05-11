import { ref, computed, useTemplateRef } from 'vue'
import { UButton, UDropdownMenu, UBadge, UCheckbox } from '#components'
import { getPaginationRowModel } from '@tanstack/table-core'
import { upperFirst } from 'scule'
/**
 * Configuration UI commune pour tous les tableaux du projet.
 * Respecte la charte graphique définie dans GEMINI.md.
 */
export const tableUI = {
    base: 'table-auto border-separate border-spacing-0 border border-(--ui-border) rounded-t-lg w-full',
    thead: '[&>tr]:bg-(--ui-bg-elevated)/50 [&>tr]:after:content-none',
    tbody: '[&>tr]:last:[&>td]:border-b-0',
    th: 'py-1 first:rounded-tl-[calc(var(--ui-radius)*2)] last:rounded-tr-[calc(var(--ui-radius)*2)] border-y border-(--ui-border) first:border-l last:border-r pl-2',
    td: 'border-b border-(--ui-border) p-2'
}

/**
 * Composable réutilisable pour la gestion des tables avec pagination,
 * filtres et visibilité des colonnes.
 *
 * Évite la duplication de la logique de table dans chaque page/composant.
 */
export function useDataTable(options?: { pageSize?: number; filterColumnId?: string }) {
    const table = useTemplateRef<any>('table')
    const columnFilters = ref<{ id: string; value: string }[]>(
        []
    )
    const columnVisibility = ref<Record<string, boolean>>({})
    const rowSelection = ref<Record<string, boolean>>({})

    const pagination = ref({
        pageIndex: 0,
        pageSize: options?.pageSize ?? 10
    })

    const paginationOptions = {
        getPaginationRowModel: getPaginationRowModel()
    }

    const statusFilter = ref('all')

    /**
     * Génère les items du dropdown "Affichage" à partir d'une liste statique d'IDs de colonnes.
     * N'utilise JAMAIS tableApi pour éviter les boucles de réactivité infinies.
     * @param columnIds - Tableau d'IDs de colonnes cachables
     */
    function buildColumnDisplayItems(columnIds: string[]) {
        return computed(() =>
            columnIds.map((id) => ({
                label: upperFirst(id),
                type: 'checkbox' as const,
                checked: columnVisibility.value[id] !== false,
                onUpdateChecked(checked: boolean) {
                    columnVisibility.value[id] = !!checked
                },
                onSelect(e?: Event) {
                    e?.preventDefault()
                }
            }))
        )
    }

    /** Nombre de lignes sélectionnées (filtrées) */
    const selectedRowCount = computed(
        () => table.value?.tableApi?.getFilteredSelectedRowModel().rows.length ?? 0
    )

    /** Nombre total de lignes (filtrées) */
    const totalFilteredRows = computed(
        () => table.value?.tableApi?.getFilteredRowModel().rows.length ?? 0
    )

    /** Index de la page courante (1-indexé pour UPagination) */
    const currentPage = computed(
        () => (table.value?.tableApi?.getState().pagination.pageIndex ?? 0) + 1
    )

    /** Taille de page courante */
    const currentPageSize = computed(
        () => table.value?.tableApi?.getState().pagination.pageSize ?? options?.pageSize ?? 10
    )

    function setPage(page: number) {
        table.value?.tableApi?.setPageIndex(page - 1)
    }

    function setStatusFilter(column: string, value: string) {
        if (!table.value?.tableApi) return
        const col = table.value.tableApi.getColumn(column)
        if (!col) return
        col.setFilterValue(value === 'all' ? undefined : value)
    }

    return {
        // Template refs
        table,
        // Resolved components (pour les render functions)
        UButton,
        UDropdownMenu,
        UBadge,
        UCheckbox,
        // États liés à la table
        columnFilters,
        columnVisibility,
        rowSelection,
        pagination,
        paginationOptions,
        statusFilter,
        // Helpers
        buildColumnDisplayItems,
        selectedRowCount,
        totalFilteredRows,
        currentPage,
        currentPageSize,
        // Fonctions utilitaires
        setPage,
        setStatusFilter,
        // UI
        tableUI
    }
}
