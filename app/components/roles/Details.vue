<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent, SelectMenuItem, TableColumn } from '@nuxt/ui'
import type { Lookup, Profil, Role, UserRole } from '~/types'
import { UButton, UDropdownMenu } from '#components'

let props = defineProps({
    role: {
        type: Object as PropType<Role | null>,
        required: true
    }
})
const ArticleSchema = z.object({
    type_article_id: z.string().min(6, 'Code must be at least 6 characters'),
    code: z.string().min(6, 'Code must be at least 6 characters'),
    nom: z.string().min(6, 'Name must be at least 6 characters'),
    description: z.string().min(5, 'Description must be at least 5 characters')
})
const supabase = useSupabaseClient()
const open = ref(false)
const selectedUserID = ref(null)
const toast = useToast()
type Schema = z.output<typeof ArticleSchema>
const parametresStore = useParametresStore()
const state = reactive<Partial<Schema>>({
    code: undefined,
    nom: undefined,
    description: undefined,
    type_article_id: undefined,
})

const columns: TableColumn<UserRole>[] = [
    {
        accessorKey: 'Utilisateur',
        header: 'Utilisateur',
        cell: ({ row }) => h('div', { class: 'flex items-center gap-3' }, [
            h('p', { class: 'font-medium text-(--ui-text-highlighted)' }, row.original.user.nom)
        ])
    },
    {
        accessorKey: 'organisation',
        header: 'Organisation',
        cell: ({ row }) => h('div', { class: 'flex items-center gap-3' }, [
            h('p', { class: 'font-medium text-(--ui-text-highlighted)' }, row.original.organisation.nom)
        ])
    },
    {
        id: 'date_debut',
        header: () => h('div', { class: 'text-center' }, 'Date debut'),
        cell: ({ row }) => h('div', { class: 'text-center' }, [
            h(UButton, {
                color: 'neutral',
                variant: 'solid',
                icon: 'i-lucide-eye',
                onClick: () => {

                }
            })
        ]),
    },
    {
        id: 'action',
        header: () => h('div', { class: 'text-center' }, 'Actions'),
        cell: ({ row }) => h('div', { class: 'text-center' }, [
            h(UButton, {
                color: 'neutral',
                variant: 'soft',
                icon: 'i-lucide-trash-2',
                onClick: () => {

                }
            })
        ]),
    }
]

const { profils, usersRoles } = storeToRefs(parametresStore)

const userItems = computed<SelectMenuItem[]>(() => profils.value?.map((item: any) => ({
    label: item.nom,
    id: item.id
})) || [])
const emit = defineEmits(['role-added'])

async function onSubmit(event: FormSubmitEvent<Schema>) {
    const { data, error } = await supabase
        .from('articles')
        .insert(event?.data as any)
        .select()

    if (error) {
        toast.add({ title: 'Error', description: `Can't add new role ${error.message}`, color: 'error' })
    } else {
        toast.add({ title: 'Success', description: `New role ${event.data.nom} added`, color: 'success' })
        open.value = false
        emit('role-added')
    }
}
</script>

<template>
    <UModal v-model:open="open" :title="'Details ' + props.role?.nom"
        :description="'Details du role ' + props.role?.nom">
        <UButton label="Add role" icon="i-lucide-plus" />

        <template #body>
            <div v-if="props.role" class="space-y-6 mb-4">
                <!-- Détails de l'article -->
                <div
                    class="grid grid-cols-2 gap-4 text-sm p-4 bg-(--ui-bg-elevated) rounded-lg border border-(--ui-border)">
                    <div>
                        <p class="text-(--ui-text-muted) mb-1">Nom</p>
                        <p class="font-medium text-(--ui-text-highlighted)">{{ props.role.nom }}</p>
                    </div>
                    <div>
                        <p class="text-(--ui-text-muted) mb-1">Code</p>
                        <p class="font-mono text-(--ui-text-highlighted)">{{ props.role.code }}</p>
                    </div>
                    <div class="col-span-2">
                        <p class="text-(--ui-text-muted) mb-1">Description</p>
                        <p>{{ props.role.description }}</p>
                    </div>
                    <div v-if="props.role.entite" class="col-span-2">
                        <p class="text-(--ui-text-muted) mb-1">Entité</p>
                        <p class="font-medium text-(--ui-text-highlighted)">
                            {{ (props.role.entite as any)?.nom }}
                        </p>
                    </div>
                </div>


            </div>
            <div v-else class="py-12 flex justify-center">
                <UIcon name="i-lucide-loader-2" class="animate-spin h-8 w-8 text-(--ui-primary)" />
            </div>
            <UForm :schema="ArticleSchema" :state="state" class="space-y-4 mb-3" @submit="onSubmit">
                <!-- Formulaire d'ajout d'affectation -->
                <div class="flex items-end gap-2">
                    <div class="flex-1">
                        <UFormField name="organisation">
                            <USelectMenu v-model="selectedUserID" value-key="id" :items="userItems"
                                placeholder="Choisir un utilisateur..." class="w-full" />
                        </UFormField>
                    </div>
                    <UButton label="Ajouter" icon="i-lucide-link" :disabled="!selectedUserID" type="submit" />
                </div>
            </UForm>


            <!-- Liste des affectations -->
            <UTable :data="usersRoles || []" :columns="columns"
                class="border border-(--ui-border) rounded-md overflow-hidden" :ui="{
                    base: 'table-fixed border-separate border-spacing-0',
                    thead: '[&>tr]:bg-(--ui-bg-elevated)/50 [&>tr]:after:content-none',
                    tbody: '[&>tr]:last:[&>td]:border-b-0',
                    th: 'py-2 px-3 border-y border-(--ui-border) first:border-l last:border-r',
                    td: 'py-2 px-3 border-b border-(--ui-border)'
                }">
                <template #empty-state>
                    <div class="flex flex-col items-center justify-center py-6 text-(--ui-text-muted) text-sm">
                        <p>Aucun utilisateur n'est affecté à ce rôle.</p>
                    </div>
                </template>
            </UTable>
        </template>
    </UModal>
</template>
