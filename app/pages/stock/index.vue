<template>
  <UDashboardPanel id="stock-view" :ui-pro="{ body: 'p-6 bg-(--ui-bg-elevated)/50', header: 'p-0' }">
    <template #header>
      <UDashboardNavbar title="Stock" :ui-pro="{ root: 'py-1' }">
        <template #left>
          <!-- <UDashboardSidebarCollapse /> -->
          <USelectMenu v-model="organisation_id" value-key="id" :items="itemsOrganisationsAffectes" class="w-64"
            placeholder="Selectionner une organisation" searchable />
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
                placeholder="Statut" class="min-w-28" @update:model-value="setStatusFilter('statut', $event)" />

              <UDropdownMenu :items="columnDisplayItems" :content="{ align: 'end' }">
                <UButton label="Affichage" color="neutral" variant="outline" trailing-icon="i-lucide-settings-2" />
              </UDropdownMenu>
              <UDropdownMenu :items="exportItems" :content="{ align: 'end' }">
                <UButton label="Exporter" icon="i-lucide-download" color="neutral" variant="subtle" size="sm" />
              </UDropdownMenu>
              <UButton label="Imprimer" icon="i-lucide-printer" color="neutral" variant="subtle" size="sm" />
            </div>
          </div>
        </template>
      </UDashboardNavbar>
    </template>
    <template #body>
      <!-- Statistiques et Indicateurs -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 m-2">
        <UCard :ui="{ body: 'p-4' }"
          class="bg-(--ui-bg-elevated)/50 border-(--ui-border) shadow-sm hover:shadow-md transition-shadow">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-primary/10 rounded-lg">
              <UIcon name="i-lucide-package" class="w-5 h-5 text-primary" />
            </div>
            <div>
              <p class="text-xs font-medium text-(--ui-text-muted) uppercase">Total Références</p>
              <p class="text-2xl font-bold text-(--ui-text-highlighted)">{{ totalSKUs }}</p>
            </div>
          </div>
        </UCard>

        <UCard :ui="{ body: 'p-4' }"
          class="bg-(--ui-bg-elevated)/50 border-(--ui-border) shadow-sm hover:shadow-md transition-shadow">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-info/10 rounded-lg">
              <UIcon name="i-lucide-boxes" class="w-5 h-5 text-info" />
            </div>
            <div>
              <p class="text-xs font-medium text-(--ui-text-muted) uppercase">Quantité Totale</p>
              <p class="text-2xl font-bold text-(--ui-text-highlighted)">{{ totalQuantity }}</p>
            </div>
          </div>
        </UCard>

        <UCard :ui="{ body: 'p-4' }"
          class="bg-(--ui-bg-elevated)/50 border-(--ui-border) shadow-sm hover:shadow-md transition-shadow">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-warning/10 rounded-lg">
              <UIcon name="i-lucide-alert-triangle" class="w-5 h-5 text-warning" />
            </div>
            <div>
              <p class="text-xs font-medium text-(--ui-text-muted) uppercase">Stock Faible</p>
              <p class="text-2xl font-bold text-(--ui-text-highlighted)">{{ lowStockCount }}</p>
            </div>
          </div>
        </UCard>

        <UCard :ui="{ body: 'p-4' }"
          class="bg-(--ui-bg-elevated)/50 border-(--ui-border) shadow-sm hover:shadow-md transition-shadow">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-error/10 rounded-lg">
              <UIcon name="i-lucide-x-circle" class="w-5 h-5 text-error" />
            </div>
            <div>
              <p class="text-xs font-medium text-(--ui-text-muted) uppercase">En Rupture</p>
              <p class="text-2xl font-bold text-(--ui-text-highlighted)">{{ outOfStockCount }}</p>
            </div>
          </div>
        </UCard>
      </div>
      <div class="flex flex-row justify-between bg-(--ui-bg-elevated)/50 p-2 rounded-lg m-2">
        <!-- Filtres actifs -->
        <div v-if="columnFilters.length > 0"
          class="flex flex-wrap items-center gap-2  bg-(--ui-bg-elevated)/30 rounded-lg border border-(--ui-border) border-dashed">
          <UIcon name="i-lucide-filter-x" class="w-4 h-4 text-(--ui-text-muted)" />
          <p class="text-sm text-(--ui-text-muted) mr-1">Filtres actifs :</p>
          <template v-for="filter in columnFilters" :key="filter.id">
            <UBadge variant="subtle" color="primary" class="pr-1">
              <span class="text-xs opacity-70 mr-1">{{ columnLabels[filter.id] || filter.id }} :</span>
              <span class="font-medium mr-1">{{ filter.value }}</span>
              <UButton icon="i-lucide-x" variant="ghost" color="neutral" size="xs" :padded="false"
                class="hover:text-error" @click="clearFilter(filter.id)" />
            </UBadge>
          </template>
          <UButton variant="link" color="error" size="xs" icon="i-lucide-trash-2" class="ml-auto"
            @click="columnFilters = []" />
        </div>
        <OrganisationsAddEmplacementModal :parent="organisation_id" />
      </div>



      <UTable ref="table" v-model:column-filters="columnFilters" v-model:column-visibility="columnVisibility"
        v-model:row-selection="rowSelection" v-model:pagination="pagination" empty="Aucune reception disponible"
        :pagination-options="paginationOptions" class="shrink-0 m-2" :data="stock || []" :columns="columns"
        :loading="pending" :ui="tableUI" />

      <div class="flex items-center justify-between gap-3 border-t border-(--ui-border) pt-4 mt-auto">
        <div class="text-sm text-(--ui-text-muted)">
          {{ selectedRowCount }} sur {{ totalFilteredRows }} ligne(s) sélectionnée(s).
        </div>

        <div class="flex items-center gap-1.5">
          <UPagination :default-page="currentPage" :items-per-page="currentPageSize" :total="totalFilteredRows"
            @update:page="setPage" />
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import type { Row } from '@tanstack/table-core'
import type { TableColumn, DropdownMenuItem, SelectMenuItem } from '@nuxt/ui'
import type { Affectation, Organisation, STKHeader, Stock } from '~/types'
import * as XLSX from 'xlsx'
import { tableUI } from '~/composables/useDataTable'

// 1. SEO
useHead({
  title: 'Stock',
  meta: [
    { name: 'description', content: 'Consulter les stocks.' }
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
const UIcon = resolveComponent('UIcon')
const UPopover = resolveComponent('UPopover')
const UInput = resolveComponent('UInput')

// 4. Refs d'état UI
const openSlideOver = ref(false)
const openConfirmDelete = ref(false)
const selectedStock = ref<Stock | null>(null)
const receptionToDelete = ref<Stock | null>(null)
const searchInput = ref('')
const organisation_id = ref<string | null>(null)

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
} = useDataTable({ filterColumnId: 'article_id', pageSize: 100 })

// Libellés pour les filtres actifs
const columnLabels: Record<string, string> = {
  'article.nom': 'Article',
  'organisation.nom': 'Magasin',
  'location.nom': 'Emplacement',
  'numero_lot': 'N° Lot',
  'quantite': 'Quantité',
  'statut': 'Statut'
}

function clearFilter(id: string) {
  columnFilters.value = columnFilters.value.filter(f => f.id !== id)
}

const exportItems = computed(() => [
  [
    {
      label: 'Exporter en CSV',
      icon: 'i-lucide-file-text',
      onSelect: () => exportToCSV()
    },
    {
      label: 'Exporter en Excel (XLSX)',
      icon: 'i-lucide-file-spreadsheet',
      onSelect: () => exportToXLSX()
    }
  ]
])

// Statistiques calculées
const totalSKUs = computed(() => {
  if (!stock.value) return 0
  return new Set(stock.value.map(s => s.article?.id)).size
})

const totalQuantity = computed(() => {
  if (!stock.value) return 0
  return stock.value.reduce((acc, curr) => acc + (Number(curr.quantite) || 0), 0)
})

const lowStockCount = computed(() => {
  if (!stock.value) return 0
  // On considère < 10 comme stock faible pour la démo
  return stock.value.filter(s => s.quantite > 0 && s.quantite < 10).length
})

const outOfStockCount = computed(() => {
  if (!stock.value) return 0
  return stock.value.filter(s => s.quantite <= 0).length
})

// IDs des colonnes cachables
const columnDisplayItems = buildColumnDisplayItems(['select', 'details', 'numero_document', 'numero_commande', 'in_organisation', 'date_trx', 'statut', 'actions'])

// logic de recherche
const debouncedSearch = useDebounceFn((val: string) => {
  table.value?.tableApi?.getColumn('numero_document')?.setFilterValue(val)
}, 300)

watch(searchInput, (val) => {
  debouncedSearch(val)
})

// const { data: organisations } = await useLazyAsyncData('stk-organisations-select', async () => {
//   const { data } = await supabase.from('affectations')
//     .select('*, organisation:organisation_id(*, lookup:lookup_id(*))')
//     .eq('lookup.code', '')
//     console.log(data)
//   return data || []
// })

const { getAffectationsMagasin: organisations } = useParametresStore()

const itemsOrganisationsAffectes = computed<SelectMenuItem[]>(() =>
  organisations?.map((org: Affectation) => ({
    label: org.organisation?.nom,
    id: org.id
  })) || []
)

// 5.1 Helper pour les headers de recherche
function renderSearchableHeader(label: string, column: any) {
  const filterValue = column.getFilterValue() as string
  const isSorted = column.getIsSorted()

  return h(UPopover, {
    content: { align: 'start', side: 'bottom', sideOffset: 8, class: 'p-2 w-48' }
  }, {
    default: () => h(UButton, {
      color: filterValue ? 'primary' : 'neutral',
      variant: 'ghost',
      label: label,
      icon: filterValue ? 'i-lucide-filter' : 'i-lucide-search',
      trailingIcon: isSorted
        ? isSorted === 'asc' ? 'i-lucide-arrow-up-narrow-wide' : 'i-lucide-arrow-down-wide-narrow'
        : undefined,
      class: '-mx-2.5 w-full justify-start'
    }),
    content: () => h(UInput, {
      modelValue: filterValue,
      'onUpdate:modelValue': (val: string) => column.setFilterValue(val),
      placeholder: `Filtrer ${label.toLowerCase()}...`,
      icon: 'i-lucide-search',
      size: 'sm',
      autofocus: true,
      class: 'w-full',
      onKeydown: (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
          // L'appui sur Entrée ferme le popover naturellement si on perd le focus ou via un signal
        }
      }
    })
  })
}

// 6. Définition des colonnes
const columns: TableColumn<Stock>[] = [
  // {
  //   id: 'details',
  //   header: 'Détails',
  //   cell: ({ row }) => h(UButton, {
  //     color: 'neutral',
  //     variant: 'ghost',
  //     icon: 'solar:pen-line-duotone',
  //     // class: '-mx-2.5',
  //     onClick: () => {
  //       selectedStock.value = row.original
  //       openSlideOver.value = true
  //     }
  //   }),
  // },
  {
    accessorKey: 'article.nom',
    header: ({ column }) => renderSearchableHeader('Article', column),
    meta: {
      class: { td: 'min-w-[300px] w-[300px]', th: 'w-[300px]' }
    },
    cell: ({ row }) => h('p', { class: 'whitespace-nowrap' }, row.original.article?.nom)
  },
  {
    accessorKey: 'organisation.nom',
    header: ({ column }) => renderSearchableHeader('Magasin', column),
    meta: {
      class: { td: 'min-w-48' }
    },
    cell: ({ row }) => h('p', undefined, row.original.organisation?.nom)
  },
  {
    accessorKey: 'location.nom',
    header: ({ column }) => renderSearchableHeader('Emplacement', column),
    meta: {
      class: { td: 'min-w-48' }
    },
    cell: ({ row }) => h('p', undefined, row.original.location?.nom)
  },
  {
    accessorKey: 'numero_lot',
    header: ({ column }) => renderSearchableHeader('N° Lot', column),
    meta: {
      class: { td: 'min-w-48' }
    },
    cell: ({ row }) => h('p', { class: 'font-medium text-(--ui-text-highlighted)' }, row.original.numero_lot)
  },

  {
    accessorKey: 'quantite',
    header: ({ column }) => renderSearchableHeader('Quantité', column),
    meta: {
      class: { td: 'min-w-48' }
    },
    cell: ({ row }) => {
      const qty = Number(row.original.quantite) || 0
      let colorClass = 'text-(--ui-text-muted)'
      let icon = ''

      if (qty <= 0) {
        colorClass = 'text-error font-bold'
        icon = 'i-lucide-alert-circle'
      } else if (qty < 10) {
        colorClass = 'text-warning font-semibold'
        icon = 'i-lucide-alert-triangle'
      }

      return h('div', { class: 'flex items-center gap-2' }, [
        icon ? h(UIcon, { name: icon, class: 'w-4 h-4' }) : null,
        h('p', { class: colorClass }, qty.toString())
      ])
    }
  },
  // {
  //   accessorKey: 'date_trx',
  //   header: 'Date',
  //   cell: ({ row }) => {
  //     const date = row.original.date_trx ? new Date(row.original.date_trx) : null
  //     return h('p', undefined, date ? date.toLocaleDateString() : 'N/A')
  //   }
  // },
  {
    accessorKey: 'statut',
    header: 'Statut',
    filterFn: 'equals',
    meta: {
      class: { td: 'w-[1%] justify-center text-center m-auto', th: 'w-[1%]' }
    },
    cell: ({ row }) => {
      const statusStr = row.original.statut || 'actif'
      const color = {
        valide: 'warning' as const,
        actif: 'success' as const,
        annule: 'error' as const
      }[statusStr] || 'neutral'
      return h(UBadge, { class: 'capitalize', variant: 'subtle', color }, () => statusStr)
    }
  },
  {
    header: () => h('div', { class: 'text-center' }, 'Actions'),
    id: 'actions',
    meta: {
      class: { td: 'w-[1%]', th: 'w-[1%]' }
    },
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
function exportToCSV() {
  if (!stock.value || stock.value.length === 0) {
    toast.add({ title: 'Erreur', description: 'Aucune donnée à exporter', color: 'error' })
    return
  }

  // En-têtes du CSV
  const headers = ['Article', 'Magasin', 'Emplacement', 'Numéro de lot', 'Quantité', 'Statut']

  // Transformation des données
  const rows = stock.value.map(s => [
    s.article?.nom || 'N/A',
    s.organisation?.nom || 'N/A',
    s.location?.nom || 'N/A',
    s.numero_lot || '',
    s.quantite || 0,
    s.statut || 'actif'
  ])

  // Génération du contenu CSV (avec gestion des virgules dans les noms)
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell.toString().replace(/"/g, '""')}"`).join(','))
  ].join('\n')

  // Ajout du BOM UTF-8 (\uFEFF) pour corriger les problèmes d'encodage (ex: Ã© au lieu de é)
  const blob = new Blob(["\uFEFF", csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', `etat_stock_${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  toast.add({ title: 'Succès', description: 'Le fichier CSV a été généré avec succès', color: 'success' })
}

function exportToXLSX() {
  if (!stock.value || stock.value.length === 0) {
    toast.add({ title: 'Erreur', description: 'Aucune donnée à exporter', color: 'error' })
    return
  }

  // Préparation des données pour Excel
  const data = stock.value.map(s => ({
    'Article': s.article?.nom || 'N/A',
    'Magasin': s.organisation?.nom || 'N/A',
    'Emplacement': s.location?.nom || 'N/A',
    'Numéro de lot': s.numero_lot || '',
    'Quantité': s.quantite || 0,
    'Statut': s.statut || 'actif'
  }))

  // Création du classeur Excel
  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Stock')

  // Téléchargement du fichier
  XLSX.writeFile(workbook, `etat_stock_${new Date().toISOString().split('T')[0]}.xlsx`)

  toast.add({ title: 'Succès', description: 'Le fichier Excel a été généré avec succès', color: 'success' })
}

function getRowItems(row: Row<Stock>): DropdownMenuItem[][] {
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
        selectedStock.value = row.original
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
        receptionToDelete.value = row.original
        openConfirmDelete.value = true
      }
    }
  ]]
}

async function confirmDelete() {
  if (!receptionToDelete.value) return

  const { error } = await supabase
    .from('stk_trx_headers')
    .delete()
    .eq('id', receptionToDelete.value.id)

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
    await refreshStock()
  }
  openConfirmDelete.value = false
  receptionToDelete.value = null
}

// 8. Chargement des données — SEMPRE EN DERNIER
const { data: stock, pending, refresh: refreshStock } = await useLazyAsyncData('stk_data_list',
  async () => {
    const { data, error } = await supabase
      .from('stk_data')
      .select('*, article:article_id(*), organisation:organisation_id(*), location:location_id(*)')
    if (error) {
      console.error('Erreur chargement stock:', error)
      return []
    }
    return (data as Stock[]) || []
  })

// Écouter les changements en temps réel
onMounted(() => {
  const channel = supabase.channel('stk_data_realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'stk_data' }, () => {
      refreshStock()
    })
    .subscribe()

  onUnmounted(() => {
    supabase.removeChannel(channel)
  })
})
</script>
