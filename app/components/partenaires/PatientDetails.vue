<template>
    <USlideover v-model:open="openDetailsPatient" side="right" inset
                title="Details du patient"
                :description="`${props.patient?.nom} ${props.patient?.postnom} ${props.patient?.prenom}`" :ui="{ content: 'max-w-3xl' }">
        <template #body>
            <pre>{{ patient }}</pre>
            <UTabs color="primary" variant="link" :items="items" class="w-full" :ui="{ list: 'mb-2' }">
                <template #content="{ item }">
                    <div v-if="item.value == 'mutuelle'">
                        <div class="flex flex-row justify-end">
                            <UButton label="Attacher une mutuelle" icon="i-lucide-plus" color="primary"
                                     variant="solid" />
                        </div>
                        <UTable ref="table-mutuelle" v-model:column-filters="columnFilters"
                                v-model:column-visibility="columnVisibility" v-model:row-selection="rowSelection"
                                v-model:pagination="pagination" :pagination-options="paginationOptions" class="shrink-0 m-2"
                                :data="MutuellesPatient" :columns="columns" empty="Aucune mutuelle attaché à ce patient"
                                :ui="{
                                    base: 'table-fixed border-separate border-spacing-0',
                                    thead: '[&>tr]:bg-(--ui-bg-elevated)/50 [&>tr]:after:content-none',
                                    tbody: '[&>tr]:last:[&>td]:border-b-0',
                                    th: 'py-1 first:rounded-tl-[calc(var(--ui-radius)*2)] last:rounded-tr-[calc(var(--ui-radius)*2)] border-y border-(--ui-border) first:border-l last:border-r',
                                    td: 'border-b border-(--ui-border) '
                                }" />
                    </div>
                    <div v-if="item.value == 'ayant-droit'">
                        <div class="flex flex-row justify-end">
                            <UButton label="Ajouter un ayant-droit" icon="i-lucide-plus" color="primary"
                                     variant="solid" />
                        </div>
                        <UTable ref="table-ayant-droit" v-model:column-filters="columnFilters"
                                v-model:column-visibility="columnVisibility" v-model:row-selection="rowSelection"
                                v-model:pagination="pagination" :pagination-options="paginationOptions" class="shrink-0 m-2"
                                :data="MutuellesPatient" :columns="columnsAyantDroit"
                                empty="Aucun ayant droit associé à ce patient" :ui="{
                                    base: 'table-fixed border-separate border-spacing-0',
                                    thead: '[&>tr]:bg-(--ui-bg-elevated)/50 [&>tr]:after:content-none',
                                    tbody: '[&>tr]:last:[&>td]:border-b-0',
                                    th: 'py-1 first:rounded-tl-[calc(var(--ui-radius)*2)] last:rounded-tr-[calc(var(--ui-radius)*2)] border-y border-(--ui-border) first:border-l last:border-r',
                                    td: 'border-b border-(--ui-border) '
                                }" />
                    </div>
                </template>
            </UTabs>
        </template>
    </USlideover>
</template>
<script lang="ts" setup>
import type { Mutuelle, Patient, PatientMutuelle } from '~/types';
import { getPaginationRowModel, type Row } from '@tanstack/table-core'
import type { TableColumn } from '@nuxt/ui'

const supabase = useSupabaseClient()
const toast = useToast()
const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')
const props = defineProps({
    open: {
        type: Boolean,
        required: true
    },
    patient: {
        type: Object as PropType<Patient | null>,
        required: true
    },
})
const emit = defineEmits(['update:open'])
const openDetailsAyantDroit = ref(true)
const openDetailsPatient = computed({
    get: () => props.open,
    set: (value) => emit('update:open', value)
})
const columnFilters = ref([{
    id: 'mutuelle_nom',
    value: ''
}])
const items = ref([
    {
        label: 'Mutuelle',
        icon: 'ic:twotone-health-and-safety',
        value: 'mutuelle'
    },
    {
        label: 'Patients ayant-droit',
        icon: 'ion:ios-people',
        value: 'ayant-droit'
    },
])
let selectedMutuelle = ref<Mutuelle | null>(null)
let selectedAyantDroit = ref<Patient | null>(null)
const paginationOptions = {
    getPaginationRowModel: getPaginationRowModel()
}
const columnVisibility = ref()
const rowSelection = ref({ 2: true })
const pagination = ref({
    pageIndex: 0,
    pageSize: 10
})
const { data: MutuellesPatient, error, refresh: refreshMutuellesPatient, status } = await useAsyncData(
    () => `mutuelles-by-patient-${props.patient?.id}`,
    async () => {
        console.log('Fetching mutuelles for patient:', props.patient?.id)
        const { data, error } = await supabase
            .from('patients_mutuelles')
            .select('id, mutuelles!inner(*)!')
            .eq('patient_id', props.patient?.id)

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
                openDetailsPatient.value = !openDetailsPatient.value
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
            label: "Retirer ce patient de l'organisation",
            icon: 'i-lucide-trash',
            color: 'error',
            onSelect() {
                toast.add({
                    title: 'Patient retiré',
                    description: "Ce patient a été retiré de l'organisation "
                })
            }
        }
    ];
}

function getRowItemsAyantDroit(row: Patient) {
    return [
        {
            type: 'label',
            label: 'Actions'
        },
        {
            label: 'Details',
            icon: 'material-symbols:open-in-full-rounded',
            onSelect() {
                openDetailsAyantDroit.value = !openDetailsAyantDroit.value
                selectedAyantDroit.value = row
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
            label: "Retirer ce patient de l'organisation",
            icon: 'i-lucide-trash',
            color: 'error',
            onSelect() {
                toast.add({
                    title: 'Patient retiré',
                    description: "Ce patient a été retiré de l'organisation "
                })
            }
        }
    ];
}

const columns: TableColumn<PatientMutuelle>[] = [
    {
        accessorKey: 'mutuelle.nom',
        id: 'mutuelle_nom',
        header: 'Nom',
        cell: ({ row }) => {
            return h('div', { class: 'flex items-center gap-3' }, [
                h('div', undefined, [
                    h('p', { class: 'font-medium text-(--ui-text-highlighted)' }, row.original?.mutuelle?.nom),
                ])
            ])
        }
    },
    {
        accessorKey: 'date_debut',
        id: 'date_debut',
        header: 'Date début',
        cell: ({ row }) => {
            return h('div', { class: 'flex items-center gap-3' }, [
                h('div', undefined, [
                    h('p', { class: 'font-medium text-(--ui-text-highlighted)' }, row.original?.date_debut),
                ])
            ])
        }
    },
    {
        accessorKey: 'date_fin',
        id: 'date_fin',
        header: 'Date fin',
        cell: ({ row }) => {
            return h('div', { class: 'flex items-center gap-3' }, [
                h('div', undefined, [
                    h('p', { class: 'font-medium text-(--ui-text-highlighted)' }, row.original?.date_fin),
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
                        items: getRowItems(row.original.patient)
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

const columnsAyantDroit: TableColumn<Patient>[] = [
    {
        id: 'details',
        header: 'Details',
        cell: ({ row }) => h(UButton, {
            color: 'primary',
            variant: 'ghost',
            icon: 'i-lucide-eye',
            onClick: () => {
                selectedAyantDroit.value = row.original;
                openDetailsAyantDroit.value = !openDetailsAyantDroit.value;
            }
        }),
    },
    {
        accessorKey: 'patients.nom',
        id: 'patients_nom',
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
        accessorKey: 'patients.postnom',
        id: 'patients_postnom',
        header: 'Postnom',
        cell: ({ row }) => {
            return h('div', { class: 'flex items-center gap-3' }, [
                h('div', undefined, [
                    h('p', { class: 'font-medium text-(--ui-text-highlighted)' }, row.original?.postnom),
                ])
            ])
        }
    },
    {
        accessorKey: 'patients.prenom',
        id: 'patients_prenom',
        header: 'Prenom',
        cell: ({ row }) => {
            return h('div', { class: 'flex items-center gap-3' }, [
                h('div', undefined, [
                    h('p', { class: 'font-medium text-(--ui-text-highlighted)' }, row.original?.prenom),
                ])
            ])
        }
    },
    {
        accessorKey: 'patients.mrn',
        header: 'MRN',
        cell: ({ row }) => {
            return h('div', { class: 'flex items-center gap-3' }, [
                h('div', undefined, [
                    h('p', { class: 'font-medium text-(--ui-text-highlighted)' }, row.original.mrn),
                ])
            ])
        }
    },
    {
        accessorKey: 'patients.sexe',
        header: 'Sexe',
        cell: ({ row }) => {
            return h('div', { class: 'flex items-center gap-3' }, [
                h('div', undefined, [
                    h('p', { class: 'font-medium text-(--ui-text-highlighted)' }, row.original.sexe),
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
                        items: getRowItemsAyantDroit(row.original)
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