<script setup lang="ts">
const props = defineProps<{
  open: boolean
  user: any
  factors: any[]
  loading: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const UIcon = resolveComponent('UIcon')

function formatDate(date: string | null) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function getMetaJson(obj: any) {
  if (!obj) return '—'
  try { return JSON.stringify(obj, null, 2) } catch { return String(obj) }
}
</script>

<template>
  <USlideover v-model:open="open" title="Détails de l'utilisateur" description="Informations complètes du compte">
    <template #body>
      <div v-if="props.user" class="space-y-6 p-4">
        <div class="flex items-center gap-4">
          <UAvatar :alt="props.user.email" size="xl" class="shrink-0" />
          <div class="min-w-0">
            <p class="text-lg font-semibold text-(--ui-text-highlighted) truncate">{{ props.user.email }}</p>
            <p class="text-xs text-(--ui-text-muted) font-mono">{{ props.user.id }}</p>
          </div>
        </div>

        <div class="flex flex-wrap gap-1.5">
          <UBadge v-if="props.user.email_confirmed_at" color="success" variant="subtle">Email confirmé</UBadge>
          <UBadge v-else color="warning" variant="subtle">Email non confirmé</UBadge>
          <UBadge v-if="props.user.phone_confirmed_at" color="success" variant="subtle">Téléphone confirmé</UBadge>
          <UBadge v-if="props.user.banned_until" color="error" variant="subtle">Banni</UBadge>
          <UBadge v-if="props.user.is_anonymous" color="neutral" variant="subtle">Anonyme</UBadge>
          <UBadge v-if="props.user.is_sso" color="info" variant="subtle">SSO</UBadge>
          <UBadge v-if="props.factors?.length" color="info" variant="subtle">MFA actif</UBadge>
        </div>

        <USeparator />

        <div class="space-y-3">
          <h4 class="text-sm font-semibold text-(--ui-text-highlighted)">Informations</h4>
          <div class="space-y-1">
            <div class="flex justify-between text-sm"><span class="text-(--ui-text-muted)">ID</span><span class="font-mono text-xs">{{ props.user.id }}</span></div>
            <div class="flex justify-between text-sm"><span class="text-(--ui-text-muted)">Rôle</span><span>{{ props.user.role || '—' }}</span></div>
            <div class="flex justify-between text-sm"><span class="text-(--ui-text-muted)">Téléphone</span><span>{{ props.user.phone || '—' }}</span></div>
            <div class="flex justify-between text-sm"><span class="text-(--ui-text-muted)">Créé le</span><span>{{ formatDate(props.user.created_at) }}</span></div>
            <div class="flex justify-between text-sm"><span class="text-(--ui-text-muted)">Mis à jour le</span><span>{{ formatDate(props.user.updated_at) }}</span></div>
            <div class="flex justify-between text-sm"><span class="text-(--ui-text-muted)">Dernière connexion</span><span>{{ formatDate(props.user.last_sign_in_at) }}</span></div>
            <div class="flex justify-between text-sm"><span class="text-(--ui-text-muted)">Email confirmé le</span><span>{{ formatDate(props.user.email_confirmed_at) }}</span></div>
            <div class="flex justify-between text-sm"><span class="text-(--ui-text-muted)">Banni jusqu'au</span><span>{{ props.user.banned_until ? formatDate(props.user.banned_until) : 'Non banni' }}</span></div>
          </div>
        </div>

        <USeparator />

        <div v-if="props.user.identities?.length">
          <h4 class="text-sm font-semibold text-(--ui-text-highlighted) mb-3">Fournisseurs d'identité</h4>
          <div v-for="(identity, i) in props.user.identities" :key="i" class="bg-(--ui-bg-elevated)/50 border border-(--ui-border) rounded-lg p-3 space-y-1 mb-2">
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-fingerprint" class="w-4 h-4 text-primary" />
              <span class="text-sm font-medium capitalize">{{ identity.provider }}</span>
            </div>
            <p class="text-xs text-(--ui-text-muted) font-mono">ID: {{ identity.identity_id }}</p>
            <p class="text-xs text-(--ui-text-muted)">Créé le: {{ formatDate(identity.created_at) }}</p>
            <p class="text-xs text-(--ui-text-muted)">Dernière connexion: {{ formatDate(identity.last_sign_in_at) }}</p>
          </div>
        </div>

        <div v-if="props.factors?.length">
          <h4 class="text-sm font-semibold text-(--ui-text-highlighted) mb-3">Facteurs MFA</h4>
          <div v-for="(factor, i) in props.factors" :key="i" class="bg-(--ui-bg-elevated)/50 border border-(--ui-border) rounded-lg p-3 space-y-1 mb-2">
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-shield-check" class="w-4 h-4 text-green-500" />
              <span class="text-sm font-medium capitalize">{{ factor.factor_type || factor.type || 'Inconnu' }}</span>
              <UBadge :color="factor.status === 'verified' ? 'success' : 'warning'" variant="subtle" size="sm" class="ml-auto">
                {{ factor.status }}
              </UBadge>
            </div>
            <p class="text-xs text-(--ui-text-muted) font-mono">ID: {{ factor.id }}</p>
            <p class="text-xs text-(--ui-text-muted)">Créé le: {{ formatDate(factor.created_at) }}</p>
            <p class="text-xs text-(--ui-text-muted)">Mis à jour le: {{ formatDate(factor.updated_at) }}</p>
          </div>
        </div>

        <USeparator />

        <div>
          <h4 class="text-sm font-semibold text-(--ui-text-highlighted) mb-1">App Metadata</h4>
          <pre class="text-xs bg-(--ui-bg-elevated) border border-(--ui-border) rounded-lg p-3 overflow-x-auto text-(--ui-text-muted)">{{ getMetaJson(props.user.raw_app_meta_data) }}</pre>
        </div>
        <div>
          <h4 class="text-sm font-semibold text-(--ui-text-highlighted) mb-1">User Metadata</h4>
          <pre class="text-xs bg-(--ui-bg-elevated) border border-(--ui-border) rounded-lg p-3 overflow-x-auto text-(--ui-text-muted)">{{ getMetaJson(props.user.raw_user_meta_data) }}</pre>
        </div>
      </div>
    </template>
  </USlideover>
</template>
