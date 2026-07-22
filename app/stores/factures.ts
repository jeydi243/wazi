import { defineStore } from 'pinia'
import type { Facture } from '~/types'

export const useFacturesStore = defineStore('factures', () => {
  const supabase = useSupabaseClient()
  const items = ref<Facture[]>([])
  const loading = ref(false)

  async function fetchAll(_ownerId?: string | null) {
    loading.value = true
    const { data, error } = await supabase.from('invoices').select('*, client:client_id(*)')
    if (error) throw error
    if (data) items.value = data as unknown as Facture[]
    loading.value = false
    return items.value
  }

  async function create(data: Partial<Facture>) {
    const { data: created, error } = await supabase.from('invoices').insert(data).select()
    if (error) throw error
    if (created) items.value.unshift(created[0] as unknown as Facture)
    return created[0]
  }

  async function remove(id: string) {
    const { error } = await supabase.from('invoices').delete().eq('id', id)
    if (error) throw error
    items.value = items.value.filter(f => f.id !== id)
  }

  async function fetchLines(headerId: string) {
    const { data, error } = await supabase
      .from('invoices_lines')
      .select('*, article:article_id(*)')
      .eq('invoice_id', headerId)
    if (error) throw error
    return data
  }

  async function removeLine(id: string) {
    const { error } = await supabase.from('invoices_lines').delete().eq('id', id)
    if (error) throw error
  }

  function subscribeToRealtime(onChange: () => void) {
    let channel: ReturnType<typeof supabase.channel> | null = null
    onMounted(() => {
      channel = supabase
        .channel('factures_realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'factures' }, onChange)
        .subscribe()
    })
    onUnmounted(() => {
      if (channel) supabase.removeChannel(channel as any)
    })
  }

  return { items, loading, fetchAll, create, remove, fetchLines, removeLine, subscribeToRealtime }
})
