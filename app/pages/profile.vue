<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

useHead({
  title: 'Profil - Wazi',
  meta: [{ name: 'description', content: 'Gérer votre profil.' }]
})

const supabase = useSupabaseClient()
const toast = useToast()
const authUser = useSupabaseUser()

const saving = ref(false)
const uploading = ref(false)
const fileInput = ref<HTMLInputElement>()
const selectedFile = ref<File | null>(null)

const { data: profil, refresh } = await useLazyAsyncData('mon-profil', async () => {
  if (!authUser.value) return null
  const { data } = await supabase
    .from('profils')
    .select('*')
    .eq('user_id', authUser.value.id)
    .single()
  return data
})

const avatarUrl = computed(() => {
  if (selectedFile.value) return URL.createObjectURL(selectedFile.value)
  return (profil.value as any)?.avatar || null
})

const fullName = computed(() => {
  const p = profil.value
  if (!p) return authUser.value?.email || ''
  return [p.prenom, p.nom, p.postnom].filter(Boolean).join(' ') || authUser.value?.email || ''
})

const schema = z.object({
  nom: z.string().min(1, 'Le nom est requis'),
  prenom: z.string().min(1, 'Le prénom est requis'),
  postnom: z.string().optional()
})

type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
  nom: '',
  prenom: '',
  postnom: ''
})

watch(profil, (p) => {
  if (p) {
    state.nom = p.nom || ''
    state.prenom = p.prenom || ''
    state.postnom = p.postnom || ''
  }
}, { immediate: true })

async function onSubmit(event: FormSubmitEvent<Schema>) {
  if (!authUser.value) return
  saving.value = true

  try {
    const { error } = await supabase
      .from('profils')
      .update({
        nom: event.data.nom,
        prenom: event.data.prenom,
        postnom: event.data.postnom || null
      } as never)
      .eq('user_id', authUser.value.id)

    if (error) throw error

    toast.add({ title: 'Succès', description: 'Profil mis à jour.', color: 'success' })
    await refresh()
  } catch (err: any) {
    toast.add({ title: 'Erreur', description: err.message || 'Échec de la mise à jour.', color: 'error' })
  } finally {
    saving.value = false
  }
}

function onFileSelect(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files?.length) {
    selectedFile.value = input.files[0]
  }
}

async function uploadAvatar() {
  if (!selectedFile.value || !authUser.value) return
  uploading.value = true

  try {
    const fileExt = selectedFile.value.name.split('.').pop() || 'jpg'
    const fileName = `user-${authUser.value.id}-${Date.now()}.${fileExt}`
    const filePath = `avatars/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, selectedFile.value, { upsert: true })

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath)

    const { error: updateError } = await supabase
      .from('profils')
      .update({ avatar: publicUrl } as never)
      .eq('user_id', authUser.value.id)

    if (updateError) throw updateError

    toast.add({ title: 'Succès', description: 'Photo de profil mise à jour.', color: 'success' })
    selectedFile.value = null
    await refresh()
  } catch (err: any) {
    toast.add({ title: 'Erreur', description: err.message || 'Échec du téléchargement.', color: 'error' })
  } finally {
    uploading.value = false
  }
}
</script>

<template>
  <UDashboardPanel id="profile" :ui-pro="{ body: 'p-6' }">
    <template #header>
      <UDashboardNavbar title="Profil" />
    </template>
    <template #body>
      <div class="max-w-2xl mx-auto space-y-6">
        <!-- Carte Avatar -->
        <UCard :ui="{ body: 'py-6' }">
          <div class="flex flex-col items-center gap-4">
            <div class="relative group">
              <UAvatar
                :src="avatarUrl || undefined"
                :alt="fullName"
                size="3xl"
                :ui="{ root: 'ring-4 ring-(--ui-border) shadow-lg cursor-pointer transition-opacity group-hover:opacity-75' }"
                @click="fileInput?.click()"
              />
              <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <UIcon name="i-lucide-camera" class="size-8 text-primary drop-shadow-lg" />
              </div>
            </div>
            <div class="text-center">
              <h2 class="text-xl font-bold text-(--ui-text-highlighted)">{{ fullName }}</h2>
              <p class="text-sm text-(--ui-text-muted)">{{ authUser?.email }}</p>
            </div>
            <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="onFileSelect" />
            <UButton
              v-if="selectedFile"
              label="Enregistrer la photo"
              color="primary"
              :loading="uploading"
              @click="uploadAvatar"
            />
          </div>
        </UCard>

        <!-- Formulaire Informations -->
        <UCard title="Informations personnelles" description="Mettez à jour vos informations personnelles.">
          <UForm :schema="schema" :state="state" @submit="onSubmit" class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <UFormField label="Nom" name="nom" required>
                <UInput v-model="state.nom" placeholder="Votre nom" />
              </UFormField>
              <UFormField label="Prénom" name="prenom" required>
                <UInput v-model="state.prenom" placeholder="Votre prénom" />
              </UFormField>
              <UFormField label="Postnom" name="postnom">
                <UInput v-model="state.postnom" placeholder="Votre postnom" />
              </UFormField>
              <UFormField label="Email" name="email">
                <UInput :model-value="authUser?.email" type="email" disabled :ui="{ trailing: 'text-(--ui-text-muted)' }" />
              </UFormField>
            </div>
            <div class="flex justify-end pt-2">
              <UButton type="submit" label="Enregistrer" color="primary" :loading="saving" />
            </div>
          </UForm>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
