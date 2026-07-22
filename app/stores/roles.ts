import { defineStore } from 'pinia'
import type { Role, UserRole, Affectation } from '~/types'

export const useRolesStore = defineStore('roles', () => {
  const supabase = useSupabaseClient()
  const roles = ref<Role[]>([])
  const loading = ref(false)

  async function fetchAll() {
    loading.value = true
    const { data, error } = await supabase.from('roles').select('*')
    if (error) throw error
    if (data) roles.value = data as unknown as Role[]
    loading.value = false
    return roles.value
  }

  async function create(data: Partial<Role>) {
    const { data: created, error } = await supabase.from('roles').insert(data).select()
    if (error) throw error
    if (created) roles.value.unshift(created[0] as unknown as Role)
    return created[0]
  }

  async function remove(id: string) {
    const { error } = await supabase.from('roles').delete().eq('id', id)
    if (error) throw error
    roles.value = roles.value.filter(r => r.id !== id)
  }

  async function fetchUserRoles(userId: string) {
    const { data, error } = await supabase
      .from('user_roles')
      .select('id, role:roles!inner(*), date_debut, date_fin')
      .eq('user_id', userId)
    if (error) throw error
    return data as unknown as UserRole[]
  }

  async function assignRole(userId: string, roleId: string, organisationId?: string) {
    const { data, error } = await supabase.from('user_roles').insert({ user_id: userId, role_id: roleId, organisation_id: organisationId })
    if (error) throw error
    return data
  }

  async function revokeRole(id: string) {
    const { error } = await supabase.from('user_roles').update({ date_fin: new Date().toISOString() }).eq('id', id)
    if (error) throw error
  }

  async function fetchAffectations(userId: string) {
    const { data, error } = await supabase
      .from('affectations')
      .select('id, date_debut, date_fin, lookup:lookups!inner(*), organisation:organisations!inner(*)')
      .eq('user_id', userId)
    if (error) throw error
    return data as unknown as Affectation[]
  }

  async function createAffectation(data: { user_id: string; lookup_id: string; organisation_id?: string }) {
    const { data: created, error } = await supabase.from('affectations').insert(data)
    if (error) throw error
    return created
  }

  async function revokeAffectation(id: string) {
    const { error } = await supabase.from('affectations').update({ date_fin: new Date().toISOString() }).eq('id', id)
    if (error) throw error
  }

  return { roles, loading, fetchAll, create, remove, fetchUserRoles, assignRole, revokeRole, fetchAffectations, createAffectation, revokeAffectation }
})
