import { defineStore } from 'pinia'
import type { Tarifaire, TarifaireLine } from '~/types'

export const useTarifairesStore = defineStore('tarifaires', () => {
  const supabase = useSupabaseClient()
  const items = ref<Tarifaire[]>([])
  const loading = ref(false)

  async function fetchAll() {
    loading.value = true
    const { data, error } = await supabase.from('tarifaires').select('*, organisation:organisation_id(*)')
    if (error) throw error
    if (data) items.value = data as unknown as Tarifaire[]
    loading.value = false
    return items.value
  }

  async function create(data: Partial<Tarifaire>) {
    const { data: created, error } = await supabase.from('tarifaires').insert(data).select()
    if (error) throw error
    if (created) items.value.unshift(created[0] as unknown as Tarifaire)
    return created[0]
  }

  async function update(id: string, data: Partial<Tarifaire>) {
    const { data: updated, error } = await supabase.from('tarifaires').update(data).eq('id', id).select()
    if (error) throw error
    if (updated) {
      const idx = items.value.findIndex(t => t.id === id)
      if (idx !== -1) items.value[idx] = updated[0] as unknown as Tarifaire
    }
    return updated?.[0]
  }

  async function remove(id: string) {
    const { error } = await supabase.from('tarifaires').delete().eq('id', id)
    if (error) throw error
    items.value = items.value.filter(t => t.id !== id)
  }

  async function fetchLines(tarifaireId: string) {
    const { data, error } = await supabase
      .from('tarifaires_lines')
      .select('id, prix, article:articles!inner(nom, description)')
      .eq('tarifaire_id', tarifaireId)
    if (error) throw error
    return data as unknown as TarifaireLine[]
  }

  async function addLine(data: { tarifaire_id: string; article_id: string; prix: number }) {
    const { data: created, error } = await supabase.from('tarifaires_lines').insert(data).select()
    if (error) throw error
    return created?.[0]
  }

  return { items, loading, fetchAll, create, update, remove, fetchLines, addLine }
})
