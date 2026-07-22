<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'

const props = defineProps<{
  open: boolean
  schema: any
  state: any
  loading: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  submit: [event: FormSubmitEvent<any>]
}>()
</script>

<template>
  <UModal v-model:open="open" title="Inviter un utilisateur" description="Envoyez une invitation par email.">
    <UForm :schema="props.schema" :state="props.state" @submit="emit('submit', $event)" class="space-y-4 p-4">
      <UFormField label="Email" name="email" required>
        <UInput v-model="props.state.email" type="email" placeholder="email@exemple.com" />
      </UFormField>
      <UFormField label="URL de redirection" name="redirectTo">
        <UInput v-model="props.state.redirectTo" placeholder="/welcome" />
      </UFormField>
      <p class="text-xs text-(--ui-text-muted)">Un email avec un lien d'inscription sera envoyé.</p>
      <div class="flex justify-end gap-2 pt-2">
        <UButton label="Annuler" color="neutral" variant="subtle" @click="open = false" :disabled="props.loading" />
        <UButton type="submit" label="Inviter" color="info" :loading="props.loading" />
      </div>
    </UForm>
  </UModal>
</template>
