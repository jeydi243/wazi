<template>
    <USlideover v-model:open="isOpenSlideOver" description="Details du tarifaire" inset
                :title="`${props.tarifaire?.code}`" :ui="{ content: 'max-w-3xl' }">
        <template #body>
            <div class="flex flex-row justify-between">
                <UButton icon="iconoir:refresh-double" color="primary" variant="ghost" @click="refreshTarifairesLines" />
                <TarifairesAddArticle :tarifaire_id="props.tarifaire?.id" @tarifaire-added="refreshTarifairesLines" />
            </div>
            <div>
                <UTable ref="table_tarifaires_lines" v-model:column-filters="columnFilters"
                        v-model:column-visibility="columnVisibility" v-model:row-selection="rowSelection"
                        v-model:pagination="pagination" empty="Aucune ligne de tarifaire" :pagination-options="{
                            getPaginationRowModel: getPaginationRowModel()
                        }" class="shrink-0 m-2" :data="tarifairesLines || []" :columns="columnsTarifaireLine"
                        :loading="tarifairesLinesStatus === 'pending'" :ui="{
                            base: 'table-fixed border-separate border-spacing-0',
                            thead: '[&>tr]:bg-(--ui-bg-elevated)/50 [&>tr]:after:content-none',
                            tbody: '[&>tr]:last:[&>td]:border-b-0',
                            th: 'py-1 first:rounded-tl-[calc(var(--ui-radius)*2)] last:rounded-tr-[calc(var(--ui-radius)*2)] border-y border-(--ui-border) first:border-l last:border-r',
                            td: 'border-b border-(--ui-border) p-2'
                        }" />
            </div>
            <UModal v-model:open="isStopModalOpen" title="Confirmer l'arrêt de l'tarifaire">
                <template #body>
                    <div class="pl-4">
                        <p class="text-sm text-gray-500 dark:text-gray-400">
                            Êtes-vous sûr de vouloir arrêter cette tarifaire ? La date de fin sera définie à
                            aujourd'hui.
                        </p>
                    </div>
                </template>
                <template #footer="{ close }">
                    <UButton color="neutral" variant="ghost" @click="close">
                        Annuler
                    </UButton>
                    <UButton color="secondary" variant="solid" @click="stopTarrifaireLine">
                        Confirmer
                    </UButton>
                </template>
            </UModal>
        </template>
    </USlideover>
</template>
<script setup lang="ts">
import type { PropType } from 'vue'
import type { DropdownMenuItem, TableColumn } from '@nuxt/ui'
import { getPaginationRowModel, type Row } from '@tanstack/table-core'
import type { Tarifaire, TarifaireLine } from '~/types'

const props = defineProps({
    tarifaire: {
        type: Object as PropType<Tarifaire | null>,
        required: true
    },
    open: {
        type: Boolean,
        required: true
    }
})

const emit = defineEmits(['update:open'])
const supabase = useSupabaseClient()
const toast = useToast()

const { data: tarifairesLines, refresh: refreshTarifairesLines, status: tarifairesLinesStatus } = useAsyncData(
    `tarifaires-${props.tarifaire?.id}`,
    async () => {
        if (!props.tarifaire?.id) return []
        const { data, error } = await supabase.from('tarifaires_lines').select("id, prix, article:articles!inner(nom, description)").eq('tarifaire_id', props.tarifaire.id)
        if (error) {
            toast.add({
                title: 'Error',
                description: error.message,
                color: 'error'
            })
            throw error
        }
        console.log(data)
        return data as TarifaireLine[]
    },
    {
        watch: [() => props.tarifaire],
        immediate: true // Ensure it runs on mount if tarifaire is present
    }
)

const columnFilters = ref([{
    id: 'id',
    value: ''
}])

const isOpenSlideOver = computed({
    get: () => props.open,
    set: (value) => emit('update:open', value)
})

const rowSelection = ref({})
const pagination = ref({
    pageIndex: 0,
    pageSize: 10,
})
const columnVisibility = ref()
const isStopModalOpen = ref(false)
const selectedTarrifaireId = ref<number | null>(null)

async function stopTarrifaireLine() {
    if (!selectedTarrifaireId.value) return

    const { error } = await supabase
        .from('tarifaires')
        .update({ end_date: new Date().toISOString() })
        .eq('id', selectedTarrifaireId.value)

    if (error) {
        toast.add({
            title: 'Error',
            description: error.message,
            color: 'error'
        })
    } else {
        toast.add({
            title: 'Succès',
            description: 'Le tarifaire a été arrêtée avec succès.',
            color: 'success'
        })
        refreshTarifairesLines()
        isStopModalOpen.value = false
    }
}

const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')
const table_tarifaires_lines = useTemplateRef('table_tarifaires_lines')

const columnsTarifaireLine: TableColumn<TarifaireLine>[] = [
    {
        accessorKey: 'article_id',
        header: 'Article',
        cell: ({ row }) => {
            return h('div', { class: 'flex items-center gap-3' }, [

                h('div', undefined, [
                    h('p', { class: 'font-medium text-(--ui-text-highlighted)' }, row.original.article?.nom || ''),
                ])
            ])
        }
    },
    {
        accessorKey: 'prix',
        header: 'Prix',
        cell: ({ row }) => {
            return h('div', { class: 'flex items-center gap-3' }, [

                h('div', undefined, [
                    h('p', { class: 'font-medium text-(--ui-text-highlighted)' }, row.original.prix),
                ])
            ])
        }
    },
    {
        accessorKey: 'date_debut',
        header: 'Date début',
        cell: ({ row }) => {
            return h('div', { class: 'flex items-center gap-3' }, [

                h('div', undefined, [
                    h('p', { class: 'font-medium text-(--ui-text-highlighted)' }, row.original.date_debut),
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
                        items: getRowItemsTarifairesLines(row)
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

function getRowItemsTarifairesLines(row: Row<TarifaireLine>) {
    const items: DropdownMenuItem[] | DropdownMenuItem[][] = [
        {
            type: 'label',
            label: 'Actions'
        },
        {
            label: 'Copie ID',
            icon: 'i-lucide-copy',
            onSelect() {
                navigator.clipboard.writeText(row.original.id.toString())
                toast.add({
                    title: 'Copied to clipboard',
                    description: 'Article ID copied to clipboard'
                })
            }
        },
        {
            label: 'Mettre fin',
            icon: 'i-lucide-stop',
            onSelect() {
                selectedTarrifaireId.value = row.original.id
                isStopModalOpen.value = true
            }
        }
    ]

    if (!row.original) {
        items.push({
            type: 'separator'
        });

        items.push({
            label: "Supprimer l'article",
            icon: 'i-lucide-trash',
            color: 'error',
            onSelect() {
                selectedTarrifaireId.value = row.original.id
                isStopModalOpen.value = true
            }
        })
    }

    return items
}
</script>