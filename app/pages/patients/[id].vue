<template>
    <UDashboardPanel id="patient-detail" as="div" :ui="{ body: 'p-0' }">
        <template #header>
            <UDashboardNavbar>
                <template #leading>
                    <UDashboardSidebarCollapse />
                    <UBreadcrumb :items="[
                        { label: 'Home', icon: 'i-lucide-house', to: '/' },
                        { label: 'Patients', icon: 'i-lucide-users', to: '/patients' },
                        { label: patient?.nom ? `${patient.nom} ${patient.postnom}` : `#${route.params.id}` }
                    ]" />
                </template>
                <template #right>
                    <UButton label="Modifier" color="neutral" variant="subtle" icon="i-lucide-pencil"
                             @click="openEditModal = true" />
                    <UButton label="Supprimer" color="error" variant="subtle" icon="i-lucide-trash" />
                </template>
            </UDashboardNavbar>
        </template>

        <template #body>
            <!-- Loading state -->
            <div v-if="!patient" class="flex items-center justify-center h-64">
                <div class="flex flex-col items-center gap-3 text-(--ui-text-muted)">
                    <UIcon name="i-lucide-loader-circle" class="size-8 animate-spin" />
                    <p class="text-sm">Chargement du dossier patient…</p>
                </div>
            </div>

            <div v-else class="p-6 space-y-6">
                <!-- === HERO CARD — Identité du patient === -->
                <div
                    class="relative overflow-hidden rounded-2xl border border-(--ui-border) bg-(--ui-bg-elevated)/40 p-6">
                    <!-- Gradient décoratif -->
                    <div
                        class="absolute inset-0 bg-gradient-to-br from-primary-500/5 via-transparent to-transparent pointer-events-none" />

                    <div class="relative flex flex-col sm:flex-row items-start sm:items-center gap-5">
                        <!-- Avatar -->
                        <div class="relative flex-shrink-0 group cursor-pointer" @click="openAvatarModal = true">
                            <UAvatar :src="patient.avatar ?? undefined" :alt="`${patient.prenom} ${patient.nom}`"
                                     size="3xl"
                                     :ui="{ root: 'ring-4 ring-(--ui-border) shadow-lg transition-opacity group-hover:opacity-75' }" />
                            <div
                                class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                                <UIcon name="i-lucide-camera" class="size-8 text-white drop-shadow-md" />
                            </div>
                            <!-- Badge statut -->
                            <span
                                class="absolute -bottom-1 -right-1 flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ring-2 ring-(--ui-bg)"
                                :class="statusStyle.bg">
                                <span class="size-1.5 rounded-full" :class="statusStyle.dot" />
                                {{ patient.status || 'Actif' }}
                            </span>
                        </div>

                        <!-- Informations principales -->
                        <div class="flex-1 min-w-0">
                            <div class="flex flex-wrap items-center gap-2 mb-1">
                                <h1 class="text-2xl font-bold text-(--ui-text-highlighted) truncate">
                                    {{ patient.prenom }} {{ patient.nom }} {{ patient.postnom }}
                                </h1>
                                <UBadge color="neutral" variant="subtle" size="sm">
                                    {{ patient.sexe === 'M' ? '♂ Masculin' : patient.sexe === 'F' ? '♀ Féminin' :
                                        patient.sexe }}
                                </UBadge>
                            </div>
                            <p class="text-(--ui-text-muted) text-sm mb-3">
                                Dossier patient · Code <span
                                    class="font-mono font-medium text-(--ui-text)">{{ patient.code }}</span>
                            </p>

                            <!-- Méta-données rapides -->
                            <div class="flex flex-wrap gap-4 text-sm">
                                <div class="flex items-center gap-1.5 text-(--ui-text-muted)">
                                    <UIcon name="i-lucide-id-card" class="size-4 text-primary-500" />
                                    <span class="font-mono font-semibold text-(--ui-text)">{{ patient.mrn }}</span>
                                </div>
                                <div class="flex items-center gap-1.5 text-(--ui-text-muted)">
                                    <UIcon name="i-lucide-calendar" class="size-4 text-primary-500" />
                                    <span>{{ formatDate(patient.date_naissance) }}</span>
                                </div>
                                <div class="flex items-center gap-1.5 text-(--ui-text-muted)">
                                    <UIcon name="i-lucide-clock" class="size-4 text-primary-500" />
                                    <span>{{ age }} ans</span>
                                </div>
                            </div>
                        </div>

                        <!-- Actions rapides -->
                        <div class="flex items-center gap-2 self-start">
                            <UButton icon="i-lucide-calendar-plus" color="primary" variant="solid" size="sm"
                                     label="RDV" />
                            <UButton icon="hugeicons:doctor-03" color="neutral" variant="outline" size="sm"
                                     label="Consulter" />
                            <UButton icon="i-lucide-printer" color="neutral" variant="ghost" size="sm" />
                        </div>
                    </div>
                </div>

                <!-- === GRILLE 3 COLONNES — Stats rapides === -->
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div v-for="stat in quickStats" :key="stat.label"
                         class="flex items-center gap-4 rounded-xl border border-(--ui-border) bg-(--ui-bg-elevated)/30 p-4 hover:bg-(--ui-bg-elevated)/60 transition-colors">
                        <div class="flex size-10 flex-shrink-0 items-center justify-center rounded-lg"
                             :class="stat.iconBg">
                            <UIcon :name="stat.icon" class="size-5" :class="stat.iconColor" />
                        </div>
                        <div>
                            <p class="text-xs text-(--ui-text-muted) uppercase tracking-wide">{{ stat.label }}</p>
                            <p class="text-lg font-bold text-(--ui-text-highlighted)">{{ stat.value }}</p>
                        </div>
                    </div>
                </div>

                <!-- === TABS — Sections détaillées === -->
                <div class="rounded-xl border border-(--ui-border) overflow-hidden">
                    <UTabs v-model="activeTabIndex" :items="tabs" color="primary" variant="link" :ui="{
                        list: 'bg-(--ui-bg-elevated)/50 border-b border-(--ui-border) px-4 pt-1 rounded-none',
                        content: 'p-5'
                    }">
                        <template #content="{ item }">
                            <!-- Tab : Informations personnelles -->
                            <div v-if="item.value === 'info'" class="space-y-5">
                                <p class="text-xs font-semibold uppercase tracking-widest text-(--ui-text-muted)">
                                    Identité civile
                                </p>
                                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <InfoField label="Nom" :value="patient.nom" icon="i-lucide-user" />
                                    <InfoField label="Prénom" :value="patient.prenom" icon="i-lucide-user" />
                                    <InfoField label="Post-nom" :value="patient.postnom" icon="i-lucide-user" />
                                    <InfoField label="Sexe" :value="patient.sexe === 'M' ? 'Masculin' : 'Féminin'"
                                               icon="i-lucide-venus-and-mars" />
                                    <InfoField label="Date de naissance" :value="formatDate(patient.date_naissance)"
                                               icon="i-lucide-calendar" />
                                    <InfoField label="Âge" :value="`${age} ans`" icon="i-lucide-clock" />
                                </div>
                                <USeparator />
                                <p class="text-xs font-semibold uppercase tracking-widest text-(--ui-text-muted)">
                                    Identifiants
                                </p>
                                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <InfoField label="MRN" :value="patient.mrn" icon="i-lucide-id-card" mono />
                                    <InfoField label="Code patient" :value="patient.code" icon="i-lucide-hash" mono />
                                    <InfoField label="Statut" :value="patient.status || 'Actif'"
                                               icon="i-lucide-activity" />
                                </div>
                            </div>

                            <!-- Tab : Consultations -->
                            <div v-if="item.value === 'consultations'" class="space-y-4">
                                <div class="flex items-center justify-between">
                                    <p class="text-xs font-semibold uppercase tracking-widest text-(--ui-text-muted)">
                                        Historique des consultations
                                    </p>
                                    <UButton label="Nouvelle consultation" icon="i-lucide-plus" size="md"
                                             color="primary" variant="subtle" />
                                </div>
                                <div
                                    class="flex flex-col items-center justify-center py-12 gap-3 text-(--ui-text-muted) rounded-lg border border-dashed border-(--ui-border)">
                                    <UIcon name="hugeicons:doctor-03" class="size-10 opacity-40" />
                                    <p class="text-sm">Aucune consultation enregistrée</p>
                                </div>
                            </div>

                            <!-- Tab : Rendez-vous -->
                            <div v-if="item.value === 'rdv'" class="space-y-4">
                                <div class="flex items-center justify-between">
                                    <p class="text-xs font-semibold uppercase tracking-widest text-(--ui-text-muted)">
                                        Rendez-vous
                                    </p>
                                    <UButton label="Nouveau RDV" icon="i-lucide-calendar-plus" size="md" color="primary"
                                             variant="subtle" />
                                </div>
                                <div
                                    class="flex flex-col items-center justify-center py-12 gap-3 text-(--ui-text-muted) rounded-lg border border-dashed border-(--ui-border)">
                                    <UIcon name="i-lucide-calendar-x" class="size-10 opacity-40" />
                                    <p class="text-sm">Aucun rendez-vous planifié</p>
                                </div>
                            </div>

                            <!-- Tab : Mutuelles -->
                            <div v-if="item.value === 'mutuelle'" class="space-y-4">
                                <div class="flex items-center justify-between">
                                    <p class="text-xs font-semibold uppercase tracking-widest text-(--ui-text-muted)">
                                        Couverture santé
                                    </p>
                                    <UButton label="Ajouter une mutuelle" icon="i-lucide-plus" size="md" color="primary"
                                             variant="subtle" />
                                </div>
                                <div
                                    class="flex flex-col items-center justify-center py-12 gap-3 text-(--ui-text-muted) rounded-lg border border-dashed border-(--ui-border)">
                                    <UIcon name="ic:twotone-health-and-safety" class="size-10 opacity-40" />
                                    <p class="text-sm">Aucune mutuelle attachée</p>
                                </div>
                            </div>
                        </template>
                    </UTabs>
                </div>

                <PatientsEditModal v-if="patient" v-model:open="openEditModal" :patient="patient"
                                   @patient-updated="refreshPatient" />
                <PatientsAvatarUpdateModal v-if="patient" v-model:open="openAvatarModal" :patient="patient"
                                           @avatar-updated="refreshPatient" />
            </div>
        </template>
    </UDashboardPanel>
</template>

<script setup lang="ts">
import type { Patient } from '~/types'

definePageMeta({
    name: 'patients-id',
})

const route = useRoute()
const supabase = useSupabaseClient()

const { data: patient, refresh: refreshPatient } = await useAsyncData<Patient>('patient-' + route.params.id, async () => {
    const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', route.params.id)
        .single()
    if (error) throw error
    return data
})

const openEditModal = ref(false)
const openAvatarModal = ref(false)

useHead({
    title: computed(() => patient.value ? `${patient.value.prenom} ${patient.value.nom} — Patient` : 'Patient'),
    meta: [{ name: 'description', content: 'Dossier complet du patient.' }]
})

// ── Onglets ─────────────────────────────────────────────────────────────────
const activeTabIndex = ref(0)
const tabs = [
    { label: 'Informations', value: 'info', icon: 'i-lucide-user' },
    { label: 'Consultations', value: 'consultations', icon: 'hugeicons:doctor-03' },
    { label: 'Rendez-vous', value: 'rdv', icon: 'i-lucide-calendar' },
    { label: 'Mutuelle', value: 'mutuelle', icon: 'ic:twotone-health-and-safety' },
]

// ── Calculs dérivés ──────────────────────────────────────────────────────────
const age = computed(() => {
    if (!patient.value?.date_naissance) return '—'
    const birth = new Date(patient.value.date_naissance)
    const today = new Date()
    let a = today.getFullYear() - birth.getFullYear()
    if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) a--
    return a
})

const statusStyle = computed(() => {
    const s = patient.value?.status?.toLowerCase() ?? ''
    const map: Record<string, { bg: string; dot: string }> = {
        actif: { bg: 'bg-success-100 text-success-700 dark:bg-success-900/40 dark:text-success-400', dot: 'bg-success-500' },
        inactif: { bg: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400', dot: 'bg-neutral-400' },
        décédé: { bg: 'bg-error-100 text-error-700 dark:bg-error-900/40 dark:text-error-400', dot: 'bg-error-500' },
    }
    return map[s] ?? map['actif']
})

const quickStats = computed(() => [
    { label: 'Consultations', value: '—', icon: 'hugeicons:doctor-03', iconBg: 'bg-primary-500/10', iconColor: 'text-primary-500' },
    { label: 'Rendez-vous', value: '—', icon: 'i-lucide-calendar-check', iconBg: 'bg-success-500/10', iconColor: 'text-success-500' },
    { label: 'Mutuelles', value: '—', icon: 'ic:twotone-health-and-safety', iconBg: 'bg-warning-500/10', iconColor: 'text-warning-500' },
])

// ── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(dateStr: string | null | undefined) {
    if (!dateStr) return '—'
    return new Intl.DateTimeFormat('fr-CD', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(dateStr))
}
</script>
