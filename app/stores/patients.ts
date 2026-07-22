import { defineStore } from 'pinia'
import type { Patient, PatientOrg, PatientMutuelle, Mutuelle } from '~/types'

export const usePatientsStore = defineStore('patients', () => {
  const supabase = useSupabaseClient()
  const items = ref<Patient[]>([])
  const loading = ref(false)

  async function fetchAll() {
    loading.value = true
    const { data, error } = await supabase.from('patients').select()
    if (error) throw error
    if (data) items.value = data as unknown as Patient[]
    loading.value = false
    return items.value
  }

  async function fetchById(id: string) {
    const { data, error } = await supabase.from('patients').select('*').eq('id', id).single()
    if (error) throw error
    return data as unknown as Patient
  }

  async function create(data: Partial<Patient>) {
    const { data: created, error } = await supabase.from('patients').insert(data).select()
    if (error) throw error
    if (created) items.value.unshift(created[0] as unknown as Patient)
    return created[0]
  }

  async function update(id: string, data: Partial<Patient>) {
    const { data: updated, error } = await supabase.from('patients').update(data).eq('id', id).select()
    if (error) throw error
    if (updated) {
      const idx = items.value.findIndex(p => p.id === id)
      if (idx !== -1) items.value[idx] = updated[0] as unknown as Patient
    }
    return updated?.[0]
  }

  async function updateAvatar(id: string, avatar: string) {
    const { error } = await supabase.from('patients').update({ avatar }).eq('id', id)
    if (error) throw error
    const idx = items.value.findIndex(p => p.id === id)
    if (idx !== -1) items.value[idx].avatar = avatar
  }

  async function remove(id: string) {
    const { error } = await supabase.from('patients').delete().eq('id', id)
    if (error) throw error
    items.value = items.value.filter(p => p.id !== id)
  }

  async function fetchPatientOrgs(organisationId: string) {
    const { data, error } = await supabase
      .from('patients_organisations')
      .select('id, patients!inner(*)')
      .eq('organisation_id', organisationId)
    if (error) throw error
    return data as unknown as PatientOrg[]
  }

  async function attachPatientOrg(patientId: string, organisationId: string) {
    const { data, error } = await supabase.from('patients_organisations').insert({ patient_id: patientId, organisation_id: organisationId }).select()
    if (error) throw error
    return data?.[0]
  }

  async function fetchPatientMutuelles(patientId: string) {
    const { data, error } = await supabase
      .from('patients_mutuelles')
      .select('id, mutuelles!inner(*)')
      .eq('patient_id', patientId)
    if (error) throw error
    return data as unknown as PatientMutuelle[]
  }

  async function fetchMutuelles(organisationId: string) {
    const { data, error } = await supabase
      .from('mutuelles')
      .select('*')
      .eq('organisation_id', organisationId)
    if (error) throw error
    return data as unknown as Mutuelle[]
  }

  return { items, loading, fetchAll, fetchById, create, update, updateAvatar, remove, fetchPatientOrgs, attachPatientOrg, fetchPatientMutuelles, fetchMutuelles }
})
