import { defineStore } from 'pinia'
import type { Lookup, Classe, Organisation, Affectation } from '~/types'

export const useParametresStore = defineStore('parametres', () => {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()
  const lookups = ref<Lookup[]>([])
  const classes = ref<Classe[]>([])
  const organisations = ref<Organisation[]>([])
  const affectations = ref<Affectation[]>([])
  let channels: any = null

  const getClasseById = computed(() => (id: string) => {
    return classes.value.find(classe => classe.id === id)?.nom
  })
  const getLookupsById = computed(() => (id: string) => {
    return lookups.value.find(lookup => lookup.id == id)?.nom
  })

  const getClasseItems = computed(() => {
    return classes.value.map(classe => ({
      label: classe.nom,
      id: classe.id
    }))
  })


  const getAffectations = computed(() => affectations.value)
  const getAffectationsMagasin = computed(() => affectations.value.filter(a => a.organisation?.lookup?.code === 'MAG'))
  const getEmplacements = computed(() => (organisation_parent_id: string) => organisations.value.filter(o => o.lookup?.code === 'EMP' && o.organisation_parent_id === organisation_parent_id))
  const getTypeOrganisation = computed(() => lookups.value.filter(lookup => lookup.classe.code === 'T-ORG'))

  async function init_user() {
    if (!user.value) {
      return {
        data: null,
        error: 'User not logged in',
        loading: false
      }
    }

    const { data: affectationsData, error: affectationsError } = await supabase
      .from('affectations')
      .select('id,date_debut,date_fin,client_id, user_id, organisation:organisation_id(id, nom, code, description, lookup:lookup_id(id, code, description, classe:classe_id(*,code,description)))')
      .eq('user_id', user.value.id)

    if (affectationsData) affectations.value = affectationsData as unknown as Affectation[]

    return {
      data: {
        affectations: affectationsData
      },
      error: affectationsError,
      loading: false
    }
  }

  async function init() {
    const { data: lookupsData, error: lookupsError } = await supabase.from('lookups').select('*, classe:classe_id(id, code,description)')
    if (lookupsData) lookups.value = lookupsData as unknown as Lookup[]

    const { data: classesData, error: classesError } = await supabase.from('classes').select('*')
    if (classesData) classes.value = classesData as unknown as Classe[]

    const { data: organisationsData, error: organisationsError } = await supabase.from('organisations').select('*, lookup:lookup_id(id, code, description, classe:classe_id(id, code,description))')
    if (organisationsData) organisations.value = organisationsData as unknown as Organisation[]


    if (!channels) {
      channels = supabase.channel('custom-all-channel')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'organisations' },
          (payload) => {
            console.log('Change received organisations', payload)
            if (payload.eventType === 'INSERT') {
              organisations.value.push(payload.new as unknown as Organisation)
            }
            if (payload.eventType === 'UPDATE') {
              const index = organisations.value.findIndex(o => o.id === payload.new.id)
              if (index !== -1) {
                organisations.value[index] = payload.new as unknown as Organisation
              }
            }
            if (payload.eventType === 'DELETE') {
              const index = organisations.value.findIndex(o => o.id === payload.old.id)
              if (index !== -1) {
                organisations.value.splice(index, 1)
              }
            }
          }
        )
        .subscribe()
    }
    return {
      data: {
        lookups: lookupsData,
        classes: classesData,
        organisations: organisationsData
      },
      error: lookupsError || classesError || organisationsError,
      loading: false
    }
  }

  return {
    lookups,
    classes,
    organisations,
    affectations,
    getClasseById,
    getClasseItems,
    getLookupsById,
    init,
    init_user,
    getAffectations,
    getAffectationsMagasin,
    getTypeOrganisation,
    getEmplacements
  }
})
