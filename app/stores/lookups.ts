import { defineStore } from 'pinia'
import type { Lookup, Classe } from '~/types'

export const useLookupsStore = defineStore('lookups', () => {
  const supabase = useSupabaseClient()
  const lookups = ref<Lookup[]>([])
  const classes = ref<Classe[]>([])
  const loading = ref(false)

  async function fetchAll() {
    loading.value = true
    const [lookupsRes, classesRes] = await Promise.allSettled([
      supabase.from('lookups').select('*, classe:classe_id(*)'),
      supabase.from('classes').select('*'),
    ])

    if (lookupsRes.status === 'fulfilled' && lookupsRes.value.data) {
      lookups.value = lookupsRes.value.data as unknown as Lookup[]
    }
    if (classesRes.status === 'fulfilled' && classesRes.value.data) {
      classes.value = classesRes.value.data as unknown as Classe[]
    }
    loading.value = false
  }

  async function fetchLookupsByClass(classId: string) {
    const { data, error } = await supabase
      .from('lookups')
      .select('*')
      .eq('classe_id', classId)
    if (error) throw error
    return data as unknown as Lookup[]
  }

  async function createLookup(data: Partial<Lookup>) {
    const { data: created, error } = await supabase.from('lookups').insert(data).select()
    if (error) throw error
    if (created) lookups.value.push(created[0] as unknown as Lookup)
    return created
  }

  async function updateLookup(id: string, data: Partial<Lookup>) {
    const { data: updated, error } = await supabase.from('lookups').update(data).eq('id', id).select()
    if (error) throw error
    if (updated) {
      const idx = lookups.value.findIndex(l => l.id === id)
      if (idx !== -1) lookups.value[idx] = updated[0] as unknown as Lookup
    }
    return updated
  }

  async function removeLookup(id: string) {
    const { error } = await supabase.from('lookups').delete().eq('id', id)
    if (error) throw error
    lookups.value = lookups.value.filter(l => l.id !== id)
  }

  async function createClasse(data: Partial<Classe>) {
    const { data: created, error } = await supabase.from('classes').insert(data).select()
    if (error) throw error
    if (created) classes.value.push(created[0] as unknown as Classe)
    return created
  }

  async function updateClasse(id: string, data: Partial<Classe>) {
    const { data: updated, error } = await supabase.from('classes').update(data).eq('id', id).select()
    if (error) throw error
    if (updated) {
      const idx = classes.value.findIndex(c => c.id === id)
      if (idx !== -1) classes.value[idx] = updated[0] as unknown as Classe
    }
    return updated
  }

  const getTypeFactures = computed(() => lookups.value.filter(l => l.classe?.table_name === 'type_factures'))
  const getTypeAvoirs = computed(() => lookups.value.filter(l => l.classe?.table_name === 'type_avoirs'))
  const getModePaiement = computed(() => lookups.value.filter(l => l.classe?.table_name === 'mode_paiements'))
  const getConditionPaiement = computed(() => lookups.value.filter(l => l.classe?.table_name === 'conditions_paiements'))
  const getDevise = computed(() => lookups.value.filter(l => l.classe?.table_name === 'devises'))
  const getTypeClient = computed(() => lookups.value.filter(l => l.classe?.table_name === 'type_clients'))
  const getTypeArticles = computed(() => lookups.value.filter(l => l.classe?.table_name === 'type_articles'))
  const getTypeOrganisations = computed(() => lookups.value.filter(l => l.classe?.table_name === 'type_organisations'))
  const getGroupeTaxation = computed(() => lookups.value.filter(l => l.classe?.table_name === 'groupe_taxation'))

  return {
    lookups, classes, loading,
    fetchAll, fetchLookupsByClass,
    createLookup, updateLookup, removeLookup,
    createClasse, updateClasse,
    getTypeFactures, getTypeAvoirs, getModePaiement, getConditionPaiement,
    getDevise, getTypeClient, getTypeArticles, getTypeOrganisations, getGroupeTaxation,
  }
})
