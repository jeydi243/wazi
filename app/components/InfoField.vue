<script setup lang="ts">
defineProps<{
    label: string
    value?: string | number | null
    icon?: string
    mono?: boolean
}>()
</script>

<template>
    <div
        class="flex items-start gap-3 rounded-lg p-3 bg-(--ui-bg-elevated)/30 hover:bg-(--ui-bg-elevated)/60 transition-colors border border-(--ui-border)/50">
        <div class="flex size-8 flex-shrink-0 items-center justify-center rounded-md bg-primary-500/10 mt-0.5">
            <UIcon :name="icon ?? 'i-lucide-info'" class="size-4 text-primary-500" />
        </div>
        <div class="min-w-0">
            <p class="text-xs text-(--ui-text-muted) mb-0.5">{{ label }}</p>
            <p class="text-sm font-medium text-(--ui-text-highlighted) truncate" :class="mono ? 'font-mono' : ''">
                {{ value || '—' }}
            </p>
        </div>
    </div>
</template>
