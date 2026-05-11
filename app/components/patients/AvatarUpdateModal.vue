<script setup lang="ts">
import type { Patient } from '~/types'

const props = defineProps({
    open: { type: Boolean, required: true },
    patient: { type: Object as PropType<Patient | null>, required: true }
})
const emit = defineEmits(['update:open', 'avatar-updated'])

const isOpen = computed({
    get: () => props.open,
    set: (value) => emit('update:open', value)
})

const toast = useToast()
const supabase = useSupabaseClient()
const loading = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const selectedFile = ref<File | null>(null)
const previewUrl = ref<string | null>(null)

function onFileSelect(event: Event) {
    const input = event.target as HTMLInputElement
    if (input.files && input.files.length > 0) {
        const file = input.files.item(0)
        selectedFile.value = file
        if (file) {
            previewUrl.value = URL.createObjectURL(file)
        }
    }
}

async function uploadAvatar() {
    if (!selectedFile.value || !props.patient?.id) return
    loading.value = true

    try {
        const fileExt = selectedFile.value.name.split('.').pop() || 'jpg'
        // Construction unique pour éviter le cache / conflits (ID + timestamp)
        const fileName = `patient-${props.patient.id}-${Date.now()}.${fileExt}`
        const filePath = `avatars/${fileName}`

        // Upload vers le bucket par défaut de ton app (ici "avatars", assure-toi qu'il existe)
        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, selectedFile.value, { upsert: true })

        if (uploadError) throw uploadError

        // Récupérer l'URL Publique
        const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath)

        // Sauvegarder dans la table "patients"
        const { error: updateError } = await (supabase as any)
            .from('patients')
            .update({ avatar: publicUrl })
            .eq('id', props.patient.id)

        if (updateError) throw updateError

        toast.add({ title: 'Succès', description: 'Photo de profil mise à jour.', color: 'success' })
        emit('avatar-updated')
        isOpen.value = false
        // Purge preview
        selectedFile.value = null
        previewUrl.value = null
    } catch (error: any) {
        toast.add({ title: 'Erreur', description: error.message || 'Échec lors de la mise à jour.', color: 'error' })
    } finally {
        loading.value = false
    }
}

// Remise à zéro quand la modale se ferme
watch(() => props.open, (val) => {
    if (!val) {
        selectedFile.value = null
        previewUrl.value = null
    }
})
</script>

<template>
    <UModal v-model:open="isOpen" title="Changer la photo" description="Uploadez une nouvelle image pour ce dossier.">
        <template #body>
            <div class="flex flex-col items-center gap-6 py-4">
                <div class="relative group">
                    <UAvatar :src="previewUrl || patient?.avatar || undefined" size="3xl"
                             :ui="{ root: 'ring-4 ring-(--ui-border) shadow-lg cursor-pointer transition-opacity group-hover:opacity-75' }"
                             @click="fileInput?.click()" />
                    <div
                        class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                        <UIcon name="i-lucide-camera" class="size-8 text-primary font-bold shadow-sm" />
                    </div>
                </div>

                <div class="text-center">
                    <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="onFileSelect" />
                    <UButton label="Choisir une image" icon="i-lucide-image" color="neutral" variant="outline"
                             @click="fileInput?.click()" />
                    <p class="text-xs text-(--ui-text-muted) mt-2">JPG, PNG. Max 5 MB.</p>
                </div>
            </div>

            <div class="flex justify-end gap-2 mt-4">
                <UButton label="Annuler" color="neutral" variant="subtle" @click="isOpen = false" />
                <UButton label="Enregistrer" icon="i-lucide-save" color="primary" variant="solid" :loading="loading"
                         :disabled="!selectedFile" @click="uploadAvatar" />
            </div>
        </template>
    </UModal>
</template>
