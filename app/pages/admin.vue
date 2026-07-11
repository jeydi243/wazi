<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent, DropdownMenuItem } from '@nuxt/ui'

definePageMeta({
  middleware: 'admin',
})

useHead({
  title: 'Administration - Wazi',
  meta: [{ name: 'description', content: 'Gestion des utilisateurs et authentification.' }]
})

const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')
const UDropdownMenu = resolveComponent('UDropdownMenu')
const UAvatar = resolveComponent('UAvatar')
const UIcon = resolveComponent('UIcon')

const toast = useToast()
const { copy } = useClipboard()
const searchInput = ref('')

const openCreate = ref(false)
const openEdit = ref(false)
const openConfirmDelete = ref(false)
const openInvite = ref(false)
const openDetail = ref(false)
const selectedUser = ref<any>(null)
const userToDelete = ref<any>(null)
const actionLoading = ref(false)

const { data: users, pending, refresh } = await useLazyAsyncData('admin-users', () =>
  $fetch('/api/users')
)

const filteredUsers = computed(() => {
  if (!searchInput.value) return users.value || []
  const q = searchInput.value.toLowerCase()
  return (users.value || []).filter((u: any) =>
    u.email?.toLowerCase().includes(q)
    || u.id?.toLowerCase().includes(q)
    || u.phone?.includes(q)
  )
})

const stats = computed(() => {
  const list = users.value || []
  const total = list.length
  const confirmed = list.filter((u: any) => u.email_confirmed_at).length
  const unconfirmed = total - confirmed
  const banned = list.filter((u: any) => u.banned_until).length
  const active = list.filter((u: any) => {
    if (!u.last_sign_in_at) return false
    return new Date(u.last_sign_in_at).toDateString() === new Date().toDateString()
  }).length
  return { total, confirmed, unconfirmed, banned, active }
})

const statusInfo = computed(() => {
  const list = users.value || []
  const total = list.length
  const confirmed = list.filter((u: any) => u.email_confirmed_at).length
  const banned = list.filter((u: any) => u.banned_until).length
  const lastSignIn = list
    .filter((u: any) => u.last_sign_in_at)
    .sort((a: any, b: any) => new Date(b.last_sign_in_at).getTime() - new Date(a.last_sign_in_at).getTime())[0]
  return { total, confirmed, banned, lastSignIn }
})

function getRowItems(row: any): DropdownMenuItem[][] {
  const user = row.original
  const isBanned = !!user.banned_until
  return [[
    { type: 'label' as const, label: user.email || 'Utilisateur' },
    { type: 'separator' as const },
    {
      label: "Copier l'ID",
      icon: 'i-lucide-copy',
      onSelect: () => copy(user.id)
    },
    {
      label: 'Détails',
      icon: 'i-lucide-eye',
      onSelect: () => openDetailModal(user)
    },
    { type: 'separator' as const },
    {
      label: 'Modifier',
      icon: 'i-lucide-pencil',
      onSelect: () => openEditModal(user)
    },
    {
      label: 'Inviter par email',
      icon: 'i-lucide-mail-plus',
      onSelect: () => openInviteModal(user)
    },
    { type: 'separator' as const },
    {
      label: 'Lien de réinitialisation',
      icon: 'i-lucide-key-round',
      onSelect: () => generateRecoveryLink(user)
    },
    {
      label: 'Lien magique',
      icon: 'i-lucide-sparkles',
      onSelect: () => generateMagicLink(user)
    },
    { type: 'separator' as const },
    {
      label: isBanned ? 'Débannir' : 'Bannir',
      icon: isBanned ? 'i-lucide-check-circle' : 'i-lucide-ban',
      color: isBanned ? 'success' : ('warning' as any),
      onSelect: () => toggleBan(user)
    },
    { type: 'separator' as const },
    {
      label: 'Supprimer',
      icon: 'i-lucide-trash',
      color: 'error' as const,
      onSelect: () => confirmDelete(user)
    }
  ]]
}

function formatDate(date: string | null) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function formatDateShort(date: string | null) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

function getIdentities(user: any) {
  if (!user.identities?.length) return []
  return user.identities.map((i: any) => ({
    provider: i.provider,
    identityId: i.identity_id,
    createdAt: i.created_at,
    lastSignIn: i.last_sign_in_at
  }))
}

function getMetaJson(obj: any) {
  if (!obj) return '—'
  try {
    return JSON.stringify(obj, null, 2)
  } catch {
    return String(obj)
  }
}

const columns = computed(() => [
  {
    id: 'email',
    header: 'Email',
    accessorKey: 'email',
    cell: ({ row }: any) => {
      const user = row.original
      const isBanned = !!user.banned_until
      return h('div', { class: 'flex items-center gap-2.5' }, [
        h('div', { class: 'relative shrink-0' }, [
          h(UAvatar, {
            alt: user.email,
            size: 'sm',
            class: isBanned ? 'opacity-50 grayscale' : ''
          }),
          user.email_confirmed_at
            ? h('span', {
              class: 'absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-(--ui-bg) rounded-full'
            })
            : null
        ]),
        h('div', { class: 'min-w-0' }, [
          h('p', { class: 'font-medium text-(--ui-text-highlighted) truncate' }, user.email || '—'),
          h('p', { class: 'text-xs text-(--ui-text-muted) truncate font-mono' }, user.id?.slice(0, 16) + '...')
        ])
      ])
    }
  },
  {
    id: 'status',
    header: 'Statut',
    accessorFn: (row: any) => row,
    cell: ({ row }: any) => {
      const user = row.original
      const isBanned = !!user.banned_until
      const confirmed = !!user.email_confirmed_at
      const hasMfa = !!user.factors?.length
      return h('div', { class: 'flex flex-col gap-0.5' }, [
        h(UBadge, {
          color: confirmed ? 'success' : 'warning',
          variant: 'subtle',
          size: 'sm',
          class: 'capitalize'
        }, () => confirmed ? 'Confirmé' : 'En attente'),
        isBanned ? h(UBadge, {
          color: 'error',
          variant: 'subtle',
          size: 'sm',
          class: 'capitalize mt-0.5'
        }, () => 'Banni') : null,
        hasMfa ? h(UBadge, {
          color: 'info',
          variant: 'subtle',
          size: 'sm',
          class: 'capitalize mt-0.5'
        }, () => 'MFA') : null
      ])
    }
  },
  {
    id: 'created_at',
    header: 'Créé le',
    accessorKey: 'created_at',
    cell: ({ row }: any) => h('div', { class: 'flex flex-col' }, [
      h('p', { class: 'text-sm' }, formatDateShort(row.original.created_at)),
      h('p', { class: 'text-xs text-(--ui-text-muted)', title: row.original.id }, row.original.role || '—')
    ])
  },
  {
    id: 'last_sign_in_at',
    header: 'Dernière connexion',
    accessorKey: 'last_sign_in_at',
    cell: ({ row }: any) => {
      const date = row.original.last_sign_in_at
      if (!date) return h('span', { class: 'text-sm text-(--ui-text-muted)' }, 'Jamais')
      return h('p', { class: 'text-sm text-(--ui-text-muted)' }, formatDateShort(date))
    }
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }: any) => h('div', { class: 'text-center' },
      h(UDropdownMenu, {
        content: { align: 'end' },
        items: getRowItems(row)
      }, () => h(UButton, {
        icon: 'i-lucide-ellipsis-vertical',
        color: 'neutral',
        variant: 'ghost',
        size: 'sm'
      }))
    )
  }
])

// --- Création ---
const createSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, '6 caractères minimum')
})
type CreateSchema = z.output<typeof createSchema>
const createState = reactive<Partial<CreateSchema>>({ email: '', password: '' })

async function onCreateSubmit(event: FormSubmitEvent<CreateSchema>) {
  actionLoading.value = true
  try {
    await $fetch('/api/users', {
      method: 'POST',
      body: {
        email: event.data.email,
        password: event.data.password,
        email_confirm: true
      }
    })
    toast.add({ title: 'Succès', description: 'Utilisateur créé avec succès.', color: 'success' })
    openCreate.value = false
    createState.email = ''
    createState.password = ''
    await refresh()
  } catch (err: any) {
    toast.add({ title: 'Erreur', description: err.data?.statusMessage || err.message, color: 'error' })
  } finally {
    actionLoading.value = false
  }
}

// --- Modification ---
const editSchema = z.object({
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  password: z.string().min(6, '6 caractères minimum').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  email_confirm: z.boolean().optional()
})
type EditSchema = z.output<typeof editSchema>
const editState = reactive<Partial<EditSchema>>({ email: '', password: '', phone: '', email_confirm: true })

function openEditModal(user: any) {
  selectedUser.value = user
  editState.email = user.email || ''
  editState.password = ''
  editState.phone = user.phone || ''
  editState.email_confirm = !!user.email_confirmed_at
  openEdit.value = true
}

async function onEditSubmit(event: FormSubmitEvent<EditSchema>) {
  if (!selectedUser.value) return
  const body: any = {}
  if (event.data.email && event.data.email !== selectedUser.value.email) body.email = event.data.email
  if (event.data.password) body.password = event.data.password
  if (event.data.phone && event.data.phone !== selectedUser.value.phone) body.phone = event.data.phone
  body.email_confirm = event.data.email_confirm !== false

  if (!body.email && !body.password && !body.phone && (!event.data.email_confirm || body.email_confirm === !!selectedUser.value.email_confirmed_at)) {
    toast.add({ title: 'Info', description: 'Aucune modification.', color: 'warning' })
    return
  }

  actionLoading.value = true
  try {
    await $fetch(`/api/users/${selectedUser.value.id}`, { method: 'PUT', body })
    toast.add({ title: 'Succès', description: 'Utilisateur mis à jour.', color: 'success' })
    openEdit.value = false
    selectedUser.value = null
    await refresh()
  } catch (err: any) {
    toast.add({ title: 'Erreur', description: err.data?.statusMessage || err.message, color: 'error' })
  } finally {
    actionLoading.value = false
  }
}

// --- Suppression ---
function confirmDelete(user: any) {
  userToDelete.value = user
  openConfirmDelete.value = true
}

async function handleDelete() {
  if (!userToDelete.value) return
  actionLoading.value = true
  try {
    await $fetch(`/api/users/${userToDelete.value.id}`, { method: 'DELETE' })
    toast.add({ title: 'Supprimé', description: 'Utilisateur supprimé définitivement.', color: 'success' })
    openConfirmDelete.value = false
    userToDelete.value = null
    await refresh()
  } catch (err: any) {
    toast.add({ title: 'Erreur', description: err.data?.statusMessage || err.message, color: 'error' })
  } finally {
    actionLoading.value = false
  }
}

// --- Bannir / Débannir ---
async function toggleBan(user: any) {
  const isBanned = !!user.banned_until
  actionLoading.value = true
  try {
    await $fetch(`/api/users/${user.id}/ban`, {
      method: 'PUT',
      body: { ban: !isBanned }
    })
    toast.add({
      title: isBanned ? 'Débanni' : 'Banni',
      description: `Utilisateur ${user.email} ${isBanned ? 'débanni' : 'banni'} avec succès.`,
      color: 'success'
    })
    await refresh()
  } catch (err: any) {
    toast.add({ title: 'Erreur', description: err.data?.statusMessage || err.message, color: 'error' })
  } finally {
    actionLoading.value = false
  }
}

// --- Invitation ---
const inviteSchema = z.object({
  email: z.string().email('Email invalide'),
  redirectTo: z.string().optional().or(z.literal(''))
})
type InviteSchema = z.output<typeof inviteSchema>
const inviteState = reactive<Partial<InviteSchema>>({ email: '', redirectTo: '' })

function openInviteModal(user?: any) {
  inviteState.email = user?.email || ''
  inviteState.redirectTo = ''
  openInvite.value = true
}

async function onInviteSubmit(event: FormSubmitEvent<InviteSchema>) {
  actionLoading.value = true
  try {
    await $fetch('/api/users/invite', {
      method: 'POST',
      body: {
        email: event.data.email,
        redirectTo: event.data.redirectTo || undefined
      }
    })
    toast.add({ title: 'Succès', description: `Invitation envoyée à ${event.data.email}.`, color: 'success' })
    openInvite.value = false
    inviteState.email = ''
    inviteState.redirectTo = ''
    await refresh()
  } catch (err: any) {
    toast.add({ title: 'Erreur', description: err.data?.statusMessage || err.message, color: 'error' })
  } finally {
    actionLoading.value = false
  }
}

// --- Génération de lien ---
async function generateRecoveryLink(user: any) {
  actionLoading.value = true
  try {
    const result: any = await $fetch('/api/users/generate-link', {
      method: 'POST',
      body: { type: 'recovery', email: user.email }
    })
    await copy(result?.action_link || '')
    toast.add({ title: 'Lien copié', description: 'Le lien de réinitialisation a été copié.', color: 'success' })
  } catch (err: any) {
    toast.add({ title: 'Erreur', description: err.data?.statusMessage || err.message, color: 'error' })
  } finally {
    actionLoading.value = false
  }
}

async function generateMagicLink(user: any) {
  actionLoading.value = true
  try {
    const result: any = await $fetch('/api/users/generate-link', {
      method: 'POST',
      body: { type: 'magiclink', email: user.email }
    })
    await copy(result?.action_link || '')
    toast.add({ title: 'Lien magique copié', description: 'Le lien magique a été copié dans le presse-papier.', color: 'success' })
  } catch (err: any) {
    toast.add({ title: 'Erreur', description: err.data?.statusMessage || err.message, color: 'error' })
  } finally {
    actionLoading.value = false
  }
}

// --- Détails utilisateur ---
const detailUser = ref<any>(null)
const detailFactors = ref<any[]>([])

async function openDetailModal(user: any) {
  actionLoading.value = true
  detailUser.value = user
  detailFactors.value = []
  try {
    const updatedUser = await $fetch(`/api/users/${user.id}`)
    detailUser.value = updatedUser
    try {
      detailFactors.value = await $fetch(`/api/users/${user.id}/factors`)
    } catch {
      detailFactors.value = []
    }
  } catch {
    detailUser.value = user
  } finally {
    actionLoading.value = false
    openDetail.value = true
  }
}
</script>

<template>
  <UDashboardPanel id="admin" :ui-pro="{ body: 'p-0' }">
    <template #header>
      <UDashboardNavbar title="Administration">
        <template #right>
          <div class="flex flex-wrap items-center gap-1.5">
            <UInput v-model="searchInput" class="max-w-sm" icon="i-lucide-search"
              placeholder="Rechercher un utilisateur..." />
            <UButton label="Inviter" icon="i-lucide-mail-plus" color="info" variant="subtle"
              @click="openInviteModal()" />
            <UButton label="Nouvel utilisateur" icon="i-lucide-plus" color="primary" @click="openCreate = true" />
          </div>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="overflow-y-auto h-full">
        <!-- Stats -->
        <div class="grid grid-cols-2 lg:grid-cols-5 gap-3 p-4 pb-0">
          <div class="bg-(--ui-bg-elevated) border border-(--ui-border) rounded-xl p-4 flex flex-col gap-1">
            <div class="flex items-center justify-between">
              <span class="text-xs font-medium text-(--ui-text-muted) uppercase tracking-wide">Total</span>
              <UIcon name="i-lucide-users" class="w-4 h-4 text-(--ui-text-muted)" />
            </div>
            <span class="text-2xl font-bold text-(--ui-text-highlighted)">{{ stats.total }}</span>
            <span class="text-xs text-(--ui-text-muted)">utilisateurs en base</span>
          </div>
          <div class="bg-(--ui-bg-elevated) border border-(--ui-border) rounded-xl p-4 flex flex-col gap-1">
            <div class="flex items-center justify-between">
              <span class="text-xs font-medium text-(--ui-text-muted) uppercase tracking-wide">Confirmés</span>
              <UIcon name="i-lucide-check-circle" class="w-4 h-4 text-green-500" />
            </div>
            <span class="text-2xl font-bold text-green-600 dark:text-green-400">{{ stats.confirmed }}</span>
            <div class="w-full h-1 bg-(--ui-border) rounded-full overflow-hidden">
              <div class="h-full bg-green-500 rounded-full transition-all duration-500"
                :style="{ width: stats.total ? `${(stats.confirmed / stats.total) * 100}%` : '0%' }" />
            </div>
          </div>
          <div class="bg-(--ui-bg-elevated) border border-(--ui-border) rounded-xl p-4 flex flex-col gap-1">
            <div class="flex items-center justify-between">
              <span class="text-xs font-medium text-(--ui-text-muted) uppercase tracking-wide">En attente</span>
              <UIcon name="i-lucide-clock" class="w-4 h-4 text-amber-500" />
            </div>
            <span class="text-2xl font-bold text-amber-600 dark:text-amber-400">{{ stats.unconfirmed }}</span>
            <span class="text-xs text-(--ui-text-muted)">non confirmés</span>
          </div>
          <div class="bg-(--ui-bg-elevated) border border-(--ui-border) rounded-xl p-4 flex flex-col gap-1">
            <div class="flex items-center justify-between">
              <span class="text-xs font-medium text-(--ui-text-muted) uppercase tracking-wide">Bannis</span>
              <UIcon name="i-lucide-ban" class="w-4 h-4 text-red-500" />
            </div>
            <span class="text-2xl font-bold text-red-600 dark:text-red-400">{{ stats.banned }}</span>
            <span class="text-xs text-(--ui-text-muted)">comptes désactivés</span>
          </div>
          <div class="bg-(--ui-bg-elevated) border border-(--ui-border) rounded-xl p-4 flex flex-col gap-1">
            <div class="flex items-center justify-between">
              <span class="text-xs font-medium text-(--ui-text-muted) uppercase tracking-wide">Aujourd'hui</span>
              <UIcon name="i-lucide-activity" class="w-4 h-4 text-primary" />
            </div>
            <span class="text-2xl font-bold text-primary">{{ stats.active }}</span>
            <span class="text-xs text-(--ui-text-muted)">connexions du jour</span>
          </div>
        </div>

        <!-- Table -->
        <div class="p-4">
          <div class="bg-(--ui-bg-elevated)/50 border border-(--ui-border) rounded-xl overflow-hidden">
            <UTable :data="filteredUsers" :columns="columns" :loading="pending" class="shrink-0" :ui="{
              base: 'table-fixed border-separate border-spacing-0 w-full',
              thead: '[&>tr]:bg-(--ui-bg-elevated)/50 [&>tr]:after:content-none',
              tbody: '[&>tr]:last:[&>td]:border-b-0',
              th: 'py-2 first:rounded-tl-[calc(var(--ui-radius)*2)] last:rounded-tr-[calc(var(--ui-radius)*2)] border-y border-(--ui-border) first:border-l last:border-r pl-4',
              td: 'border-b border-(--ui-border) p-3 pl-4'
            }">
              <template #empty>
                <div class="flex flex-col items-center justify-center py-16 text-(--ui-text-muted)">
                  <UIcon name="i-lucide-users" class="w-12 h-12 mb-3 opacity-40" />
                  <p class="font-medium" v-if="!searchInput">Aucun utilisateur</p>
                  <p class="font-medium" v-else>Aucun résultat pour "{{ searchInput }}"</p>
                  <p class="text-sm mt-1" v-if="!searchInput">
                    Créez un utilisateur ou envoyez une invitation.
                  </p>
                </div>
              </template>
            </UTable>
          </div>

          <div class="flex items-center justify-between gap-3 pt-4">
            <div class="text-sm text-(--ui-text-muted)">
              {{ filteredUsers.length }} utilisateur(s)
              <span v-if="searchInput">trouvé(s)</span>
            </div>
            <UButton variant="ghost" color="neutral" icon="i-lucide-refresh-cw" size="sm" :loading="pending"
              @click="refresh()">
              Actualiser
            </UButton>
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>

  <!-- Modal: Créer -->
  <UModal v-model:open="openCreate" title="Nouvel utilisateur"
    description="Créez un compte utilisateur avec authentification.">
    <UForm :schema="createSchema" :state="createState" @submit="onCreateSubmit" class="space-y-4 p-4">
      <UFormField label="Email" name="email" required>
        <UInput v-model="createState.email" type="email" placeholder="email@exemple.com" />
      </UFormField>
      <UFormField label="Mot de passe" name="password" required>
        <UInput v-model="createState.password" type="password" placeholder="Min. 6 caractères" />
      </UFormField>
      <div class="flex justify-end gap-2 pt-2">
        <UButton label="Annuler" color="neutral" variant="subtle" @click="openCreate = false"
          :disabled="actionLoading" />
        <UButton type="submit" label="Créer" color="primary" :loading="actionLoading" />
      </div>
    </UForm>
  </UModal>

  <!-- Modal: Modifier -->
  <AdminUpdateUser v-model="openEdit" :open="openEdit" :selectedUser="selectedUser" @update:open="openEdit = $event" />

  <!-- Modal: Inviter -->
  <UModal v-model:open="openInvite" title="Inviter un utilisateur" description="Envoyez une invitation par email.">
    <UForm :schema="inviteSchema" :state="inviteState" @submit="onInviteSubmit" class="space-y-4 p-4">
      <UFormField label="Email" name="email" required>
        <UInput v-model="inviteState.email" type="email" placeholder="email@exemple.com" />
      </UFormField>
      <UFormField label="URL de redirection" name="redirectTo">
        <UInput v-model="inviteState.redirectTo" placeholder="/welcome" />
      </UFormField>
      <p class="text-xs text-(--ui-text-muted)">Un email avec un lien d'inscription sera envoyé.</p>
      <div class="flex justify-end gap-2 pt-2">
        <UButton label="Annuler" color="neutral" variant="subtle" @click="openInvite = false"
          :disabled="actionLoading" />
        <UButton type="submit" label="Inviter" color="info" :loading="actionLoading" />
      </div>
    </UForm>
  </UModal>

  <!-- Modal: Supprimer -->
  <UModal v-model:open="openConfirmDelete" title="Confirmation"
    :description="`Êtes-vous sûr de vouloir supprimer ${userToDelete?.email || 'cet utilisateur'} ? Cette action est irréversible.`">
    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton label="Annuler" color="neutral" variant="ghost" @click="openConfirmDelete = false"
          :disabled="actionLoading" />
        <UButton label="Supprimer définitivement" color="error" :loading="actionLoading" @click="handleDelete" />
      </div>
    </template>
  </UModal>

  <!-- Slideover: Détails utilisateur -->
  <USlideover v-model:open="openDetail" title="Détails de l'utilisateur" description="Informations complètes du compte">
    <template #body>
      <div v-if="detailUser" class="space-y-6 p-4">
        <!-- En-tête -->
        <div class="flex items-center gap-4">
          <UAvatar :alt="detailUser.email" size="xl" class="shrink-0" />
          <div class="min-w-0">
            <p class="text-lg font-semibold text-(--ui-text-highlighted) truncate">{{ detailUser.email }}</p>
            <p class="text-xs text-(--ui-text-muted) font-mono">{{ detailUser.id }}</p>
          </div>
        </div>

        <!-- Badges -->
        <div class="flex flex-wrap gap-1.5">
          <UBadge v-if="detailUser.email_confirmed_at" color="success" variant="subtle">Email confirmé</UBadge>
          <UBadge v-else color="warning" variant="subtle">Email non confirmé</UBadge>
          <UBadge v-if="detailUser.phone_confirmed_at" color="success" variant="subtle">Téléphone confirmé</UBadge>
          <UBadge v-if="detailUser.banned_until" color="error" variant="subtle">Banni</UBadge>
          <UBadge v-if="detailUser.is_anonymous" color="neutral" variant="subtle">Anonyme</UBadge>
          <UBadge v-if="detailUser.is_sso" color="info" variant="subtle">SSO</UBadge>
          <UBadge v-if="detailFactors?.length" color="info" variant="subtle">MFA actif</UBadge>
        </div>

        <USeparator />

        <!-- Infos -->
        <div class="space-y-3">
          <h4 class="text-sm font-semibold text-(--ui-text-highlighted)">Informations</h4>
          <InfoField label="ID" :value="detailUser.id" mono />
          <InfoField label="Rôle" :value="detailUser.role || '—'" />
          <InfoField label="Téléphone" :value="detailUser.phone || '—'" />
          <InfoField label="Créé le" :value="formatDate(detailUser.created_at)" />
          <InfoField label="Mis à jour le" :value="formatDate(detailUser.updated_at)" />
          <InfoField label="Dernière connexion" :value="formatDate(detailUser.last_sign_in_at)" />
          <InfoField label="Email confirmé le" :value="formatDate(detailUser.email_confirmed_at)" />
          <InfoField label="Téléphone confirmé le" :value="formatDate(detailUser.phone_confirmed_at)" />
          <InfoField label="Banni jusqu'au"
            :value="detailUser.banned_until ? formatDate(detailUser.banned_until) : 'Non banni'" />
          <InfoField label="Dernier changement email" :value="formatDate(detailUser.email_change_sent_at)" />
          <InfoField label="Nouvel email en attente" :value="detailUser.new_email || '—'" />
          <InfoField label="Emails envoyés inclus" :value="detailUser.invited_at ? 'Oui' : 'Non'" />
        </div>

        <USeparator />

        <!-- Identités -->
        <div v-if="detailUser.identities?.length" class="space-y-3">
          <h4 class="text-sm font-semibold text-(--ui-text-highlighted)">Fournisseurs d'identité</h4>
          <div v-for="(identity, i) in detailUser.identities" :key="i"
            class="bg-(--ui-bg-elevated)/50 border border-(--ui-border) rounded-lg p-3 space-y-1">
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-fingerprint" class="w-4 h-4 text-primary" />
              <span class="text-sm font-medium capitalize">{{ identity.provider }}</span>
            </div>
            <p class="text-xs text-(--ui-text-muted) font-mono">ID: {{ identity.identity_id }}</p>
            <p class="text-xs text-(--ui-text-muted)">Créé le: {{ formatDate(identity.created_at) }}</p>
            <p class="text-xs text-(--ui-text-muted)">Dernière connexion: {{ formatDate(identity.last_sign_in_at) }}</p>
          </div>
        </div>

        <!-- Facteurs MFA -->
        <div v-if="detailFactors?.length" class="space-y-3">
          <h4 class="text-sm font-semibold text-(--ui-text-highlighted)">Facteurs MFA</h4>
          <div v-for="(factor, i) in detailFactors" :key="i"
            class="bg-(--ui-bg-elevated)/50 border border-(--ui-border) rounded-lg p-3 space-y-1">
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-shield-check" class="w-4 h-4 text-green-500" />
              <span class="text-sm font-medium capitalize">{{ factor.factor_type || factor.type || 'Inconnu' }}</span>
              <UBadge :color="factor.status === 'verified' ? 'success' : 'warning'" variant="subtle" size="sm"
                class="ml-auto">
                {{ factor.status }}
              </UBadge>
            </div>
            <p class="text-xs text-(--ui-text-muted) font-mono">ID: {{ factor.id }}</p>
            <p class="text-xs text-(--ui-text-muted)">Créé le: {{ formatDate(factor.created_at) }}</p>
            <p class="text-xs text-(--ui-text-muted)">Mis à jour le: {{ formatDate(factor.updated_at) }}</p>
          </div>
        </div>

        <!-- Metadata -->
        <USeparator />
        <div class="space-y-3">
          <h4 class="text-sm font-semibold text-(--ui-text-highlighted)">App Metadata</h4>
          <pre
            class="text-xs bg-(--ui-bg-elevated) border border-(--ui-border) rounded-lg p-3 overflow-x-auto text-(--ui-text-muted)">{{ getMetaJson(detailUser.raw_app_meta_data) }}</pre>
        </div>
        <div class="space-y-3">
          <h4 class="text-sm font-semibold text-(--ui-text-highlighted)">User Metadata</h4>
          <pre
            class="text-xs bg-(--ui-bg-elevated) border border-(--ui-border) rounded-lg p-3 overflow-x-auto text-(--ui-text-muted)">{{ getMetaJson(detailUser.raw_user_meta_data) }}</pre>
        </div>
      </div>
    </template>
  </USlideover>
</template>
