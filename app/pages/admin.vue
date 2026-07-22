<script setup lang="ts">
definePageMeta({
  middleware: 'admin',
})

useSeoMeta({
  title: 'Administration - Wazi',
  description: 'Gestion des utilisateurs et authentification.',
})

const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')
const UDropdownMenu = resolveComponent('UDropdownMenu')
const UAvatar = resolveComponent('UAvatar')
const UIcon = resolveComponent('UIcon')

const admin = useAdminUsers()

const columns = computed(() => [
  {
    id: 'email', header: 'Email', accessorKey: 'email',
    cell: ({ row }: any) => {
      const user = row.original; const isBanned = !!user.banned_until
      return h('div', { class: 'flex items-center gap-2.5' }, [
        h('div', { class: 'relative shrink-0' }, [
          h(UAvatar, { alt: user.email, size: 'sm', class: isBanned ? 'opacity-50 grayscale' : '' }),
          user.email_confirmed_at ? h('span', { class: 'absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-(--ui-bg) rounded-full' }) : null,
        ]),
        h('div', { class: 'min-w-0' }, [
          h('p', { class: 'font-medium text-(--ui-text-highlighted) truncate' }, user.email || '—'),
          h('p', { class: 'text-xs text-(--ui-text-muted) truncate font-mono' }, user.id?.slice(0, 16) + '...'),
        ]),
      ])
    },
  },
  {
    id: 'status', header: 'Statut', accessorFn: (row: any) => row,
    cell: ({ row }: any) => {
      const user = row.original; const isBanned = !!user.banned_until; const confirmed = !!user.email_confirmed_at; const hasMfa = !!user.factors?.length
      return h('div', { class: 'flex flex-col gap-0.5' }, [
        h(UBadge, { color: confirmed ? 'success' : 'warning', variant: 'subtle', size: 'sm', class: 'capitalize' }, () => confirmed ? 'Confirmé' : 'En attente'),
        isBanned ? h(UBadge, { color: 'error', variant: 'subtle', size: 'sm', class: 'capitalize mt-0.5' }, () => 'Banni') : null,
        hasMfa ? h(UBadge, { color: 'info', variant: 'subtle', size: 'sm', class: 'capitalize mt-0.5' }, () => 'MFA') : null,
      ])
    },
  },
  {
    id: 'created_at', header: 'Créé le', accessorKey: 'created_at',
    cell: ({ row }: any) => h('div', { class: 'flex flex-col' }, [
      h('p', { class: 'text-sm' }, admin.formatDateShort(row.original.created_at)),
      h('p', { class: 'text-xs text-(--ui-text-muted)', title: row.original.id }, row.original.role || '—'),
    ]),
  },
  {
    id: 'last_sign_in_at', header: 'Dernière connexion', accessorKey: 'last_sign_in_at',
    cell: ({ row }: any) => {
      const date = row.original.last_sign_in_at
      if (!date) return h('span', { class: 'text-sm text-(--ui-text-muted)' }, 'Jamais')
      return h('p', { class: 'text-sm text-(--ui-text-muted)' }, admin.formatDateShort(date))
    },
  },
  {
    id: 'actions', header: '',
    cell: ({ row }: any) => h('div', { class: 'text-center' },
      h(UDropdownMenu, { content: { align: 'end' }, items: admin.getRowItems(row) },
        () => h(UButton, { icon: 'i-lucide-ellipsis-vertical', color: 'neutral', variant: 'ghost', size: 'sm' })),
    ),
  },
])
</script>

<template>
  <UDashboardPanel id="admin" :ui-pro="{ body: 'p-0' }">
    <template #header>
      <UDashboardNavbar title="Administration">
        <template #right>
          <div class="flex flex-wrap items-center gap-1.5">
            <UInput v-model="admin.searchInput.value" class="max-w-sm" icon="i-lucide-search" placeholder="Rechercher un utilisateur..." />
            <UButton label="Inviter" icon="i-lucide-mail-plus" color="info" variant="subtle" @click="admin.openInviteModal()" />
            <UButton label="Nouvel utilisateur" icon="i-lucide-plus" color="primary" @click="admin.openCreate = true" />
          </div>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <NuxtErrorBoundary>
      <div class="overflow-y-auto h-full">
        <AdminUserStats :stats="admin.stats.value" />

        <div class="p-4">
          <div class="bg-(--ui-bg-elevated)/50 border border-(--ui-border) rounded-xl overflow-hidden">
            <UTable :data="admin.filteredUsers.value" :columns="columns" :loading="admin.pending.value" class="shrink-0" :ui="{
              base: 'table-fixed border-separate border-spacing-0 w-full',
              thead: '[&>tr]:bg-(--ui-bg-elevated)/50 [&>tr]:after:content-none',
              tbody: '[&>tr]:last:[&>td]:border-b-0',
              th: 'py-2 first:rounded-tl-[calc(var(--ui-radius)*2)] last:rounded-tr-[calc(var(--ui-radius)*2)] border-y border-(--ui-border) first:border-l last:border-r pl-4',
              td: 'border-b border-(--ui-border) p-3 pl-4',
            }">
              <template #empty>
                <div class="flex flex-col items-center justify-center py-16 text-(--ui-text-muted)">
                  <UIcon name="i-lucide-users" class="w-12 h-12 mb-3 opacity-40" />
                  <p class="font-medium" v-if="!admin.searchInput.value">Aucun utilisateur</p>
                  <p class="font-medium" v-else>Aucun résultat pour "{{ admin.searchInput.value }}"</p>
                  <p class="text-sm mt-1" v-if="!admin.searchInput.value">Créez un utilisateur ou envoyez une invitation.</p>
                </div>
              </template>
            </UTable>
          </div>

          <div class="flex items-center justify-between gap-3 pt-4">
            <div class="text-sm text-(--ui-text-muted)">
              {{ admin.filteredUsers.value.length }} utilisateur(s)
              <span v-if="admin.searchInput.value">trouvé(s)</span>
            </div>
            <UButton variant="ghost" color="neutral" icon="i-lucide-refresh-cw" size="sm" :loading="admin.pending.value" @click="admin.refresh()">
              Actualiser
            </UButton>
          </div>
        </div>
      </div>
      </NuxtErrorBoundary>
    </template>
  </UDashboardPanel>

  <AdminCreateUserModal v-model:open="admin.openCreate" :schema="admin.createSchema" :state="admin.createState" :loading="admin.actionLoading" @submit="admin.onCreateSubmit" />
  <AdminUpdateUser v-model="admin.openEdit" :open="admin.openEdit" :selectedUser="admin.selectedUser" @update:open="admin.openEdit = $event" />
  <AdminInviteUserModal v-model:open="admin.openInvite" :schema="admin.inviteSchema" :state="admin.inviteState" :loading="admin.actionLoading" @submit="admin.onInviteSubmit" />
  <AdminDeleteUserModal v-model:open="admin.openConfirmDelete" :user-email="admin.userToDelete?.email" :loading="admin.actionLoading" @confirm="admin.handleDelete" />
  <AdminUserDetailSlideover v-model:open="admin.openDetail" :user="admin.detailUser" :factors="admin.detailFactors" :loading="admin.actionLoading" />
</template>
