<template>
    <USlideover v-model:open="isOpenSlideOver" inset :title="`${props.user?.prenom} ${props.user?.nom}`"
                description="Description de l'utilisateur" :ui="{ content: 'max-w-3xl' }">
        <template #body>
            <!-- Design Information Utilisateur -->
            <div
                class="p-4 mx-4 mb-4 rounded-lg border border-(--ui-border) bg-(--ui-bg-elevated)/20 flex items-center justify-between transition-all hover:bg-(--ui-bg-elevated)/30">
                <div class="flex items-center gap-4">
                    <UAvatar :alt="props.user?.prenom?.[0]" size="xl"
                             class="bg-(--ui-primary)/10 text-(--ui-primary) font-bold ring-2 ring-(--ui-primary)/20" />
                    <div class="space-y-0.5">
                        <h2 class="text-xl font-bold text-(--ui-text-highlighted) tracking-tight">
                            {{ props.user?.prenom }} {{ props.user?.nom }} <span v-if="props.user?.postnom"
                                                                                 class="uppercase text-sm font-medium opacity-70">{{ props.user?.postnom }}</span>
                        </h2>
                        <div class="flex items-center gap-2 text-sm text-(--ui-text-muted)">
                            <UIcon name="i-lucide-mail" class="w-4 h-4" />
                            <span>{{ props.user?.email }}</span>
                        </div>
                    </div>
                </div>
                <div class="flex gap-2">
                    <UButton color="neutral" variant="subtle" label="Modifier" icon="i-lucide-pencil"
                             class="rounded-full px-4" @click="openEdit = true" />
                </div>
            </div>

            <UTabs :items="items" class="h-full flex flex-col" variant="link">
                <template #affectations>
                    <div class="flex flex-row justify-between">
                        <UButton icon="iconoir:refresh-double" color="primary" variant="ghost"
                                 @click="refreshAffectations" />
                        <UsersAddAffectation :user_id="props.user?.user_id || null"
                                             @affectation-added="refreshAffectations" />
                    </div>
                    <UTable ref="table_affectations" v-model:column-visibility="columnVisibility"
                            v-model:row-selection="rowSelection" v-model:pagination="pagination" empty="Aucune affectation"
                            :pagination-options="{
                                getPaginationRowModel: getPaginationRowModel()
                            }" class="shrink-0 m-2" :data="affectations || []" :columns="columnsAffectations"
                            :loading="affectationsStatus === 'pending'" :ui="{
                                base: 'table-fixed border-separate border-spacing-0',
                                thead: '[&>tr]:bg-(--ui-bg-elevated)/50 [&>tr]:after:content-none',
                                tbody: '[&>tr]:last:[&>td]:border-b-0',
                                th: 'py-1 first:rounded-tl-[calc(var(--ui-radius)*2)] last:rounded-tr-[calc(var(--ui-radius)*2)] border-y border-(--ui-border) first:border-l last:border-r',
                                td: 'border-b border-(--ui-border) p-2'
                            }" />
                </template>
                <template #roles>
                    <div class="flex flex-row justify-between">
                        <UButton icon="iconoir:refresh-double" color="primary" variant="ghost" @click="refreshRoles" />
                        <UsersAddRole :user="props.user" @role-added="refreshRoles" />
                    </div>
                    <UTable ref="table_roles" v-model:column-visibility="columnVisibility"
                            v-model:row-selection="rowSelection" v-model:pagination="pagination" empty="Aucun rôle ajouté"
                            :pagination-options="{
                                getPaginationRowModel: getPaginationRowModel()
                            }" class="shrink-0 m-2" :data="roles || []" :columns="columnsRoles"
                            :loading="rolesStatus === 'pending'" :ui="{
                                base: 'table-fixed border-separate border-spacing-0',
                                thead: '[&>tr]:bg-(--ui-bg-elevated)/50 [&>tr]:after:content-none',
                                tbody: '[&>tr]:last:[&>td]:border-b-0',
                                th: 'py-1 first:rounded-tl-[calc(var(--ui-radius)*2)] last:rounded-tr-[calc(var(--ui-radius)*2)] border-y border-(--ui-border) first:border-l last:border-r pl-2',
                                td: 'border-b border-(--ui-border) p-2'
                            }" />
                </template>
            </UTabs>
            <UModal v-model:open="isStopModalOpen" title="Confirmer l'arrêt de l'affectation">
                <template #body>
                    <div class="pl-4">
                        <p class="text-sm text-gray-500 dark:text-gray-400">
                            Êtes-vous sûr de vouloir arrêter cette affectation ? La date de fin sera définie à
                            aujourd'hui.
                        </p>
                    </div>
                </template>
                <template #footer="{ close }">
                    <UButton color="neutral" variant="ghost" @click="close">
                        Annuler
                    </UButton>
                    <UButton color="secondary" variant="solid" @click="stopAffectation">
                        Confirmer
                    </UButton>
                </template>
            </UModal>
            <UModal v-model:open="isStopRoleModalOpen" title="Retirer l'attribution du rôle">
                <template #body>
                    <div class="pl-4">
                        <p class="text-sm text-gray-500 dark:text-gray-400">
                            Êtes-vous sûr de vouloir arrêter d'attribuer ce rôle ? La date de fin sera définie à
                            aujourd'hui.
                        </p>
                    </div>
                </template>
                <template #footer="{ close }">
                    <UButton color="neutral" variant="ghost" @click="close">
                        Annuler
                    </UButton>
                    <UButton color="secondary" variant="solid" @click="stopRole">
                        Confirmer
                    </UButton>
                </template>
            </UModal>

            <UsersEditModal v-model:open="openEdit" :user="props.user" />
        </template>
    </USlideover>
</template>
<script setup lang="ts">
import type { PropType } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import { getPaginationRowModel, type Row } from '@tanstack/table-core'
import type { Affectation, Profil, Role, UserRole } from '~/types'

const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')
const table_affectations = useTemplateRef('table_affectations')
const table_roles = useTemplateRef('table_roles')
const props = defineProps({
    user: {
        type: Object as PropType<Profil | null>,
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
const items = [
    {
        label: 'Affectations',
        icon: 'i-lucide-building',
        slot: 'affectations'
    }, {
        label: 'Roles',
        icon: 'i-lucide-user-cog',
        slot: 'roles'
    },
]
const { data: affectations, refresh: refreshAffectations, status: affectationsStatus } = useAsyncData(
    `affectations-${props.user?.id}`,
    async () => {
        if (!props.user?.id) return []
        const { data, error } = await supabase.from('affectations').select("id, date_debut, date_fin, lookup:lookups!inner(*), organisation:organisations!inner(*)").eq('user_id', props.user?.user_id)
        if (error) {
            toast.add({
                title: 'Error',
                description: error.message,
                color: 'error'
            })
            throw error
        }
        console.log(data)
        return data as Affectation[]
    },
    {
        watch: [() => props.user],
        immediate: true // Ensure it runs on mount if user is present
    }
)
const { data: roles, refresh: refreshRoles, status: rolesStatus } = useAsyncData(
    `roles-${props.user?.id}`,
    async () => {
        if (!props.user?.id) return []
        const { data, error } = await supabase.from('user_roles').select("id, role:roles!inner(*), date_debut, date_fin").eq('user_id', props.user?.user_id)
        if (error) {
            toast.add({
                title: 'Error',
                description: error.message,
                color: 'error'
            })
            throw error
        }
        console.log(data)
        return data as UserRole[]
    },
    {
        watch: [() => props.user],
        immediate: true // Ensure it runs on mount if user is present
    }
)

const isOpenSlideOver = computed({
    get: () => props.open,
    set: (value) => emit('update:open', value)
})

const rowSelection = ref({})
const pagination = ref({
    pageIndex: 0,
    pageSize: 10,
})
const openEdit = ref(false)
const isStopModalOpen = ref(false)
const isStopRoleModalOpen = ref(false)
const columnVisibility = ref()
const selectedRoleId = ref<string | null>(null)
const selectedAffectationId = ref<string | null>(null)

async function stopAffectation() {
    if (!selectedAffectationId.value) return

    const { error } = await supabase
        .from('affectations')
        .update({ end_date: new Date().toISOString() } as never)
        .eq('id', selectedAffectationId.value)

    if (error) {
        toast.add({
            title: 'Error',
            description: error.message,
            color: 'error'
        })
    } else {
        toast.add({
            title: 'Succès',
            description: 'L\'affectation a été arrêtée avec succès.',
            color: 'success'
        })
        refreshAffectations()
        isStopModalOpen.value = false
    }
}
async function stopRole() {
    if (!selectedRoleId.value) return

    const { error } = await supabase
        .from('user_roles')
        .update({ date_fin: new Date().toISOString() } as never)
        .eq('id', selectedRoleId.value)

    if (error) {
        toast.add({
            title: 'Error',
            description: error.message,
            color: 'error'
        })
    } else {
        toast.add({
            title: 'Succès',
            description: 'Le rôle a été arrêté avec succès.',
            color: 'success'
        })
        refreshRoles()
        isStopRoleModalOpen.value = false
    }
}
const columnsAffectations: TableColumn<Affectation>[] = [
    {
        accessorKey: 'lookup_id',
        header: 'Type',
        cell: ({ row }) => {
            return h('div', { class: 'flex items-center gap-3' }, [

                h('div', undefined, [
                    h('p', { class: 'font-medium text-(--ui-text-highlighted)' }, row.original.lookup?.nom || ''),
                ])
            ])
        }
    },
    {
        accessorKey: 'organisation_id',
        header: 'Organisation',
        cell: ({ row }) => {
            return h('div', { class: 'flex items-center gap-3' }, [

                h('div', undefined, [
                    h('p', { class: 'font-medium text-(--ui-text-highlighted)' }, row.original.organisation?.nom || ''),
                ])
            ])
        }
    },
    {
        accessorKey: 'date_debut',
        header: 'Date de début',
        cell: ({ row }) => {
            return h('div', { class: 'flex items-center gap-3' }, [

                h('div', undefined, [
                    h('p', { class: 'font-medium text-(--ui-text-highlighted)' }, row.original.date_debut ? new Date(row.original.date_debut).toLocaleDateString() : ''),
                ])
            ])
        }
    },
    {
        accessorKey: 'date_fin',
        header: 'Date de fin',
        cell: ({ row }) => {
            return h('div', { class: 'flex items-center gap-3' }, [

                h('div', undefined, [
                    h('p', { class: 'font-medium text-(--ui-text-highlighted)' }, row.original.date_fin),
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
                        items: getRowItemsAffectations(row)
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
const columnsRoles: TableColumn<UserRole>[] = [
    {
        accessorKey: 'code',
        header: 'Code',
        cell: ({ row }) => {
            return h('div', { class: 'flex items-center gap-3' }, [

                h('div', undefined, [
                    h('p', { class: 'font-medium text-(--ui-text-highlighted)' }, row.original.role?.code || ''),
                ])
            ])
        }
    },
    {
        accessorKey: 'nom',
        header: 'Nom',
        cell: ({ row }) => {
            return h('div', { class: 'flex items-center gap-3' }, [

                h('div', undefined, [
                    h('p', { class: 'font-medium text-(--ui-text-highlighted)' }, row.original.role?.nom || ''),
                ])
            ])
        }
    },
    {
        accessorKey: 'date_debut',
        header: 'Date de début',
        cell: ({ row }) => {
            return h('div', { class: 'flex items-center gap-3' }, [

                h('div', undefined, [
                    h('p', { class: 'font-medium text-(--ui-text-highlighted)' }, row.original.date_debut ? new Date(row.original.date_debut).toLocaleDateString() : ''),
                ])
            ])
        }
    },
    {
        accessorKey: 'date_fin',
        header: 'Date de fin',
        cell: ({ row }) => {
            return h('div', { class: 'flex items-center gap-3' }, [

                h('div', undefined, [
                    h('p', { class: 'font-medium text-(--ui-text-highlighted)' }, row.original.date_fin),
                ])
            ])
        }
    },
    {
        accessorKey: 'action',
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
                        items: getRowItemsRoles(row)
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

function getRowItemsAffectations(row: Row<Affectation>) {
    const items = [
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
                    description: 'Affectation ID copied to clipboard'
                })
            }
        }
    ]

    if (!row.original.date_fin) {
        items.push({
            type: 'separator',
            label: ''
        });

        items.push({
            label: "Stopper l'affectation",
            icon: 'i-lucide-trash',
            onSelect() {
                selectedAffectationId.value = row.original.id
                isStopModalOpen.value = true
            }
        })
    }

    return items
}
function getRowItemsRoles(row: Row<UserRole>) {
    const items = [
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
                    description: 'Affectation ID copied to clipboard'
                })
            }
        }
    ]

    if (!row.original.date_fin) {
        items.push({
            type: 'separator',
            label: ''
        });

        items.push({
            label: "Stopper l'attribution de ce role",
            icon: 'i-lucide-trash',
            onSelect() {
                selectedRoleId.value = row.original.id
                isStopRoleModalOpen.value = true
            }
        })
    }

    return items
}
</script>