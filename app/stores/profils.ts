import { defineStore } from 'pinia'
import type { Profil } from '~/types'

export const useProfilsStore = defineStore('profils', () => {
  const supabase = useSupabaseClient()
  const items = ref<Profil[]>([])
  const currentProfil = ref<Profil | null>(null)
  const loading = ref(false)

  async function fetchAll(ownerId?: string | null) {
    loading.value = true
    let query = supabase.from('profils').select('*')
    if (ownerId) query = query.eq('owner_id', ownerId)
    const { data, error } = await query
    if (error) throw error
    if (data) items.value = data as unknown as Profil[]
    loading.value = false
    return items.value
  }

  async function fetchByUserId(userId: string) {
    const { data, error } = await supabase.from('profils').select('*').eq('user_id', userId).single()
    if (error) throw error
    currentProfil.value = data as unknown as Profil
    return currentProfil.value
  }

  async function updateProfil(userId: string, data: Partial<Profil>) {
    const { error } = await supabase.from('profils').update(data).eq('user_id', userId)
    if (error) throw error
    if (currentProfil.value && currentProfil.value.user_id === userId) {
      Object.assign(currentProfil.value, data)
    }
  }

  async function updateAvatar(userId: string, avatarUrl: string) {
    const { error } = await supabase.from('profils').update({ avatar: avatarUrl } as any).eq('user_id', userId)
    if (error) throw error
    if (currentProfil.value && currentProfil.value.user_id === userId) {
      (currentProfil.value as any).avatar = avatarUrl
    }
  }

  async function uploadAvatar(file: File, userId: string) {
    const filePath = `${userId}/${Date.now()}_${file.name}`
    const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true })
    if (uploadError) throw uploadError
    const { data: publicUrl } = supabase.storage.from('avatars').getPublicUrl(filePath)
    return publicUrl.publicUrl
  }

  return { items, currentProfil, loading, fetchAll, fetchByUserId, updateProfil, updateAvatar, uploadAvatar }
})
