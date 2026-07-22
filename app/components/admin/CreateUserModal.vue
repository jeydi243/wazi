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
  <UModal v-model:open="open" title="Nouvel utilisateur" description="Créez un compte utilisateur avec authentification.">
    <UForm :schema="props.schema" :state="props.state" @submit="emit('submit', $event)" class="space-y-4 p-4">
      <UFormField label="Email" name="email" required>
        <UInput v-model="props.state.email" type="email" placeholder="email@exemple.com" />
      </UFormField>
      <UFormField label="Mot de passe" name="password" required>
        <UInput v-model="props.state.password" type="password" placeholder="Min. 6 caractères" />
      </UFormField>
      <div class="flex justify-end gap-2 pt-2">
        <UButton label="Annuler" color="neutral" variant="subtle" @click="open = false" :disabled="props.loading" />
        <UButton type="submit" label="Créer" color="primary" :loading="props.loading" />
      </div>
    </UForm>
  </UModal>
</template>
