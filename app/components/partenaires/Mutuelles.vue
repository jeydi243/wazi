<template>
    <div class="p-2">
        <div class="flex flex-row justify-between mb-2">
            <div class="flex align-center">
                <UInput v-model="searchMutuelle" placeholder="Rechercher" />
                <UButton icon="i-lucide-search" class="mr-1 ml-2" @click="refreshMutuelles()" />
            </div>
            <div>
                <UButton icon="iconamoon:synchronize-light" class="mr-1" @click="refreshMutuelles()" />
                <PartenairesAddMutuelleModal />
            </div>
        </div>

        <UTable ref="table-partenaires-mutuelles" v-model:column-filters="columnFilters"
                v-model:column-visibility="columnVisibility" v-model:row-selection="rowSelection"
                v-model:pagination="pagination" :pagination-options="paginationOptions" class="shrink-0 m-2"
                :data="Mutuelles" :columns="columns" empty="Aucune mutuelles attachés à cette organisation !" :ui="{
                    base: 'table-fixed border-separate border-spacing-0 border border-(--ui-border) rounded-t-lg',
                    thead: '[&>tr]:bg-(--ui-bg-elevated)/50 [&>tr]:after:content-none',
                    tbody: '[&>tr]:last:[&>td]:border-b-0',
                    th: 'py-1 first:rounded-tl-[calc(var(--ui-radius)*2)] last:rounded-tr-[calc(var(--ui-radius)*2)] border-y border-(--ui-border) first:border-l last:border-r',
                    td: 'border-b border-(--ui-border) '
                }" />
        <PartenairesMutuelleDetails :mutuelle="selectedMutuelle" :open="openDetailsMutuelle"
                                    @update:open="openDetailsMutuelle = $event" />
    </div>
</template>
<script setup lang="ts">
import { getPaginationRowModel, type Row } from '@tanstack/table-core'
import type { TableColumn } from '@nuxt/ui'
import type { Mutuelle } from '~/types'

const props = defineProps({
    organisationId: {
        type: String,
        required: true
    }
})
const searchMutuelle = ref('')
const supabase = useSupabaseClient()
const toast = useToast()
const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')

const { data: Mutuelles, error, refresh: refreshMutuelles, status } = await useAsyncData(
    () => `mutuelles-by-partenaires-${props.organisationId}`,
    async () => {
        console.log('Fetching mutuelles for organisation:', props.organisationId)
        const { data, error } = await supabase
            .from('mutuelles')
            .select('*')
            .eq('organisation_id', props.organisationId)

        if (error) {
            console.error('Supabase error fetching mutuelles:', error)
            throw error
        }
        console.log('Fetched data:', data)
        return data
    },
    {
        watch: [() => props.organisationId]
    }
)

const columnFilters = ref([{
    id: 'mutuelles_nom',
    value: ''
}])
const selectedMutuelle = ref<Mutuelle | null>(null)
const openDetailsMutuelle = ref(false)
const paginationOptions = {
    getPaginationRowModel: getPaginationRowModel()
}
const columnVisibility = ref()
const rowSelection = ref({ 2: true })
const pagination = ref({
    pageIndex: 0,
    pageSize: 10
})
function getRowItems(row: Mutuelle) {
    return [
        {
            type: 'label',
            label: 'Actions'
        },
        {
            label: 'Details',
            icon: 'material-symbols:open-in-full-rounded',
            onSelect() {
                openDetailsMutuelle.value = !openDetailsMutuelle.value
                selectedMutuelle.value = row
            }
        },
        {
            label: 'Voir les paiements du client',
            icon: 'i-lucide-wallet'
        },
        {
            label: 'Voir la couverture santé',
            icon: 'mage:health-circle-fill'
        },
        {
            type: 'separator'
        },
        {
            label: "Copier l'ID",
            icon: 'i-lucide-copy',
            onSelect() {
                navigator.clipboard.writeText(row.id.toString())
                toast.add({
                    title: 'Copié dans le presse papier',
                })
            }
        },
        {
            type: 'separator'
        },
        {
            label: "Retirer ce mutuelle de l'organisation",
            icon: 'i-lucide-trash',
            color: 'error',
            onSelect() {
                toast.add({
                    title: 'Mutuelle retiré',
                    description: "Ce mutuelle a été retiré de l'organisation "
                })
            }
        }
    ];
}
const columns: TableColumn<Mutuelle>[] = [
    {
        id: 'details',
        header: 'Details',

        cell: ({ row }) => h(UButton, {
            color: 'primary',
            variant: 'ghost',
            icon: 'i-lucide-eye',
            onClick: () => {
                selectedMutuelle.value = row.original;
                openDetailsMutuelle.value = !openDetailsMutuelle.value;
                // console.log(row.original, openDetailsUser.value)
            }
        }),
    },
    {
        accessorKey: 'nom',
        id: 'Nom',
        // header: 'Nom',
        header: ({ column }) => {
            return h('div', { class: 'text-left px-0' }, 'Nom')
        },
        cell: ({ row }) => {
            return h('div', { class: 'flex items-center gap-3' }, [
                h('div', undefined, [
                    h('p', { class: 'font-medium text-(--ui-text-highlighted)' }, row.original?.nom),
                ])
            ])
        }
    },
    {
        accessorKey: 'code',
        id: 'code',
        header: 'Code',
        cell: ({ row }) => {
            return h('div', { class: 'flex items-center gap-3' }, [
                h('div', undefined, [
                    h('p', { class: 'font-medium text-(--ui-text-highlighted)' }, row.original?.code),
                ])
            ])
        }
    },
    {
        accessorKey: 'description',
        id: 'description',
        header: 'Description',
        cell: ({ row }) => {
            return h('div', { class: 'flex items-center gap-3' }, [
                h('div', undefined, [
                    h('p', { class: 'font-medium text-(--ui-text-highlighted)' }, row.original?.description),
                ])
            ])
        }
    },
    {
        accessorKey: 'statut',
        id: 'statut',
        header: 'Statut',
        cell: ({ row }) => {
            return h('div', { class: 'flex items-center gap-3' }, [
                h('div', undefined, [
                    h('p', { class: 'font-medium text-(--ui-text-highlighted)' }, row.original?.statut),
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
                        items: getRowItems(row.original)
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


</script>

<style></style>