<script setup lang="ts">
defineProps<{
  stats: { total: number; confirmed: number; unconfirmed: number; banned: number; active: number }
}>()

const UIcon = resolveComponent('UIcon')
</script>

<template>
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
</template>
