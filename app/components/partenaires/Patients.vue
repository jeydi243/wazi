<template>
    <div class="p-2">
        <div class="flex flex-row justify-between mb-2">
            <div class="flex align-center">
                <UInput v-model="searchPatient" placeholder="Rechercher" />
                <UButton icon="i-lucide-search" class="mr-1 ml-2" />
            </div>
            <div>
                <UButton icon="iconamoon:synchronize-light" class="mr-1" @click="refreshPatients()" />
                <KeepAlive max="10">
                    <PartenairesAttachPatientOrg class="mr-1" :organisation-id="props.organisationId"
                                                 @patient-added="refreshPatients()" />
                </KeepAlive>
                <PatientsAddModal />
            </div>
        </div>

        <UTable ref="table-partenaires-patients" v-model:column-filters="columnFilters"
                v-model:column-visibility="columnVisibility" v-model:row-selection="rowSelection"
                v-model:pagination="pagination" :pagination-options="paginationOptions" class="shrink-0 m-2"
                :data="Patients" :columns="columns" empty="Aucun patients attachés à cette organisation !" :ui="{
                    base: 'table-fixed border-separate border-spacing-0',
                    thead: '[&>tr]:bg-(--ui-bg-elevated)/50 [&>tr]:after:content-none',
                    tbody: '[&>tr]:last:[&>td]:border-b-0',
                    th: 'py-1 first:rounded-tl-[calc(var(--ui-radius)*2)] last:rounded-tr-[calc(var(--ui-radius)*2)] border-y border-(--ui-border) first:border-l last:border-r',
                    td: 'border-b border-(--ui-border) py-0 m-1'
                }" />
        <PartenairesPatientDetails :patient="selectedPatient" :open="openDetailsPatient" @update:open="openDetailsPatient = $event" />
    </div>
</template>
<script setup lang="ts">
import { getPaginationRowModel, type Row } from '@tanstack/table-core'
import type { TableColumn } from '@nuxt/ui'
import type { Patient, PatientOrg } from '~/types'

const props = defineProps({
    organisationId: {
        type: String,
        required: true
    }
})
const searchPatient = ref('')
const supabase = useSupabaseClient()
const toast = useToast()
const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')

const { data: Patients, error, refresh: refreshPatients, status } = await useAsyncData(
    () => `patients-by-partenaires-${props.organisationId}`,
    async () => {
        console.log('Fetching patients for organisation:', props.organisationId)
        const { data, error } = await supabase
            .from('patients_organisations')
            .select('id, patients!inner(*)!')
            .eq('organisation_id', props.organisationId)

        if (error) {
            console.error('Supabase error fetching patients:', error)
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
    id: 'patients_nom',
    value: ''
}])
const selectedPatient = ref<Patient | null>(null)
const openDetailsPatient = ref(false)
const paginationOptions = {
    getPaginationRowModel: getPaginationRowModel()
}
const columnVisibility = ref()
const rowSelection = ref({ 2: true })
const pagination = ref({
    pageIndex: 0,
    pageSize: 10
})
function getRowItems(row: Patient) {
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
                selectedPatient.value = row
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
const columns: TableColumn<PatientOrg>[] = [
    {
        id: 'details',
        header: 'Details',

        cell: ({ row }) => h(UButton, {
            color: 'primary',
            variant: 'ghost',
            icon: 'i-lucide-eye',
            onClick: () => {
                selectedPatient.value = row.original.patients;
                openDetailsPatient.value = !openDetailsPatient.value;
                // console.log(row.original, openDetailsUser.value)
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
                    h('p', { class: 'font-medium text-(--ui-text-highlighted)' }, row.original?.patients?.nom),
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
                    h('p', { class: 'font-medium text-(--ui-text-highlighted)' }, row.original?.patients?.postnom),
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
                    h('p', { class: 'font-medium text-(--ui-text-highlighted)' }, row.original?.patients?.prenom),
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
                    h('p', { class: 'font-medium text-(--ui-text-highlighted)' }, row.original.patients.mrn),
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
                    h('p', { class: 'font-medium text-(--ui-text-highlighted)' }, row.original.patients.sexe),
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
                        items: getRowItems(row.original.patients)
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