<script setup lang="ts">
import type { SelectMenuItem, TableColumn } from '@nuxt/ui'
import type { Role, Organisation, ArticleAffectation } from '~/types'

const props = defineProps<{ role: Role | null }>()
const open = defineModel<boolean>('open', { default: false })

const supabase = useSupabaseClient()
const toast = useToast()

const selectedOrgId = ref<string | undefined>(undefined)
const isAddingRecord = ref(false)

const UButton = resolveComponent('UButton')

// Fetch affectations (organisations) for the current article
const { data: affectations, refresh: refreshAffectations, pending: loadingAffectations } = await useAsyncData(
    () => `article-affectations-${props.role?.id}`,
    async () => {
        if (!props.role?.id) return []
        const { data, error } = await supabase
            .from('article_organisations')
            .select('*, organisation:organisations(*)')
            .eq('article_id', props.role.id)

        if (error) {
            console.error('Error fetching affectations:', error)
            return []
        }
        return data || []
    },
    { watch: [() => props.role?.id, () => open.value], immediate: true }
)

// Fetch organisations for selection (excluding already assigned)
const { data: organisations, refresh: refreshOrganisations } = await useAsyncData<Organisation[]>(
    () => `organisations-available-${props.role?.id}`,
    async () => {
        if (!props.role?.id) return []

        const { data: assigned } = await supabase
            .from('article_organisations')
            .select('organisation_id')
            .eq('article_id', props.role.id)

        let query = supabase.from('organisations').select('id, nom')

        const assignedIds = assigned?.map(a => a.organisation_id) || []
        if (assignedIds.length > 0) {
            query = query.not('id', 'in', `(${assignedIds.join(',')})`)
        }

        const { data } = await query
        return (data || []) as unknown as Organisation[]
    },
    { watch: [() => props.role?.id, () => open.value], immediate: true }
)

const orgItems = computed<SelectMenuItem[]>(() => organisations.value?.map(org => ({
    label: org.nom,
    id: String(org.id)
})) || [])

const columns: TableColumn<any>[] = [
    {
        id: 'organisation',
        header: 'Organisation',
        cell: ({ row }) => h('p', { class: 'font-medium text-(--ui-text-highlighted)' }, row.original.organisation?.nom || 'N/A')
    },
    {
        accessorKey: 'created_at',
        header: 'Date d\'affectation',
        cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString()
    },
    {
        id: 'actions',
        header: '',
        cell: ({ row }) => h('div', { class: 'flex justify-end' }, h(UButton, {
            color: 'error',
            variant: 'ghost',
            icon: 'i-lucide-trash',
            size: 'xs',
            onClick: () => deleteAffectation(row.original.id)
        }))
    }
]

async function addAffectation() {
    if (!selectedOrgId.value || !props.role?.id) return

    isAddingRecord.value = true
    const { error } = await supabase
        .from('role_organisations')
        .insert([{
            role_id: props.role.id,
            organisation_id: selectedOrgId.value
        }])

    isAddingRecord.value = false
    if (error) {
        toast.add({ title: 'Erreur', description: `Impossible d'ajouter l'affectation : ${error.message}`, color: 'error' })
    } else {
        toast.add({ title: 'Succès', description: 'Organisation affectée avec succès', color: 'success' })
        selectedOrgId.value = undefined
        refreshAffectations()
        refreshOrganisations()
    }
}

async function deleteAffectation(id: number) {
    const { error } = await supabase
        .from('article_organisations')
        .delete()
        .eq('id', id)

    if (error) {
        toast.add({ title: 'Erreur', description: `Impossible de supprimer l'affectation : ${error.message}`, color: 'error' })
    } else {
        toast.add({ title: 'Succès', description: 'Affectation supprimée', color: 'success' })
        refreshAffectations()
        refreshOrganisations()
    }
}
</script>

<template>
    <UModal v-model:open="open" title="Détails & Affectations" :description="props.role?.nom || 'Article'" :ui="{
        wrapper: 'w-[600px]'
    }">
        <template #body>
            <div v-if="props.role" class="space-y-6">
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

                <!-- Affectations -->
                <div class="space-y-4">
                    <div class="flex items-center justify-between">
                        <h3 class="text-sm font-semibold uppercase tracking-wider text-(--ui-text-muted)">
                            Organisations Affectées
                        </h3>
                    </div>

                    <!-- Formulaire d'ajout d'affectation -->
                    <div class="flex items-end gap-2">
                        <div class="flex-1">
                            <UFormField label="Affecter à une organisation" name="organisation">
                                <USelectMenu v-model="selectedOrgId" value-key="id" :items="orgItems"
                                             placeholder="Choisir une organisation..." class="w-full" />
                            </UFormField>
                        </div>
                        <UButton label="Ajouter" icon="i-lucide-link" :loading="isAddingRecord"
                                 :disabled="!selectedOrgId" @click="addAffectation" />
                    </div>

                    <!-- Liste des affectations -->
                    <UTable :data="affectations || []" :columns="columns" :loading="loadingAffectations"
                            class="border border-(--ui-border) rounded-md overflow-hidden" :ui="{
                                base: 'table-fixed border-separate border-spacing-0',
                                thead: '[&>tr]:bg-(--ui-bg-elevated)/50 [&>tr]:after:content-none',
                                tbody: '[&>tr]:last:[&>td]:border-b-0',
                                th: 'py-2 px-3 border-y border-(--ui-border) first:border-l last:border-r',
                                td: 'py-2 px-3 border-b border-(--ui-border)'
                            }">
                        <template #empty-state>
                            <div class="flex flex-col items-center justify-center py-6 text-(--ui-text-muted) text-sm">
                                <p>Aucune affectation trouvée pour cet article.</p>
                            </div>
                        </template>
                    </UTable>
                </div>
            </div>
            <div v-else class="py-12 flex justify-center">
                <UIcon name="i-lucide-loader-2" class="animate-spin h-8 w-8 text-(--ui-primary)" />
            </div>
        </template>
    </UModal>
</template>
