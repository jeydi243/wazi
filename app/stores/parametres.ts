import { defineStore } from 'pinia'
import type { Lookup, Classe, Organisation, Affectation, Facture, Client, Article, Profil, UserRole } from '~/types'

export const useParametresStore = defineStore('parametres', () => {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()
  const userStore = useUsersStore()
  const lookups = ref<Lookup[]>([])
  const classes = ref<Classe[]>([])
  const clients = ref<Client[]>([])
  const profils = ref<Profil[]>([])
  const articles = ref<Article[]>([])
  const owner_id = ref<string | null>(null)
  const usersRoles = ref<UserRole[]>([])
  const affectations = ref<Affectation[]>([])
  const organisations = ref<Organisation[]>([])
  const invoiceHeaders = ref<Facture[]>([])

  const getClasseById = computed(() => (id: string) => {
    return classes.value.find(classe => classe.id === id)?.nom
  })
  const getLookupsById = computed(() => (id: string) => {
    return lookups.value.find(lookup => lookup.id == id)?.nom
  })

  const getTypeFactures = computed(() => lookups.value.filter(lookup => lookup.classe.table_name === 'type_factures'))
  const getTypeAvoirs = computed(() => lookups.value.filter(lookup => lookup.classe.table_name === 'type_avoirs'))
  const getModePaiement = computed(() => lookups.value.filter(lookup => lookup.classe.table_name === 'mode_paiements'))
  const getConditionPaiement = computed(() => lookups.value.filter(lookup => lookup.classe.table_name === 'conditions_paiements'))
  const getDevise = computed(() => lookups.value.filter(lookup => lookup.classe.table_name === 'devises'))
  const getTypeClient = computed(() => lookups.value.filter(lookup => lookup.classe.table_name === 'type_clients'))
  const getTypeArticles = computed(() => lookups.value.filter(lookup => lookup.classe.table_name === 'type_articles'))
  const getTypeOrganisations = computed(() => lookups.value.filter(lookup => lookup.classe.table_name === 'type_organisations'))
  const getGroupeTaxation = computed(() => lookups.value.filter(lookup => lookup.classe.table_name === 'groupe_taxation'))
  const getAffectations = computed(() => affectations.value)
  const getAffectationsMagasin = computed(() => affectations.value.filter(a => a.organisation?.lookup?.code === 'MAG'))
  const getEmplacements = computed(() => (organisation_parent_id: string) => organisations.value.filter(o => o.lookup?.code === 'EMP' && o.organisation_parent_id === organisation_parent_id))
  const getTypeOrganisation = computed(() => lookups.value.filter(lookup => lookup.classe.code === 'T-ORG'))

  const getClasseItems = computed(() => {
    return classes.value.map(classe => ({
      label: classe.nom,
      id: classe.id
    }))
  })

  function setOwnerID(id: string) {
    owner_id.value = id
  }

  async function init() {
    const { usersRoles, owners } = userStore
    let profilsError: any, articlesError: any, organisationsError: any, invoicesError: any, clientsError: any, usersRolesError: any
    let profilsData: any, articlesData: any, organisationsData: any, invoicesData: any, clientsData: any, usersRolesData: any

    const { data: lookupsData, error: lookupsError } = await supabase.from('lookups').select('*, classe:classe_id(*)')
    if (lookupsError) console.error('[Store] Erreur chargement lookups:', lookupsError)
    if (lookupsData) lookups.value = lookupsData as unknown as Lookup[]

    const { data: classesData, error: classesError } = await supabase.from('classes').select('*')
    if (classesError) console.error('[Store] Erreur chargement classes:', classesError)
    if (classesData) classes.value = classesData as unknown as Classe[]

    if (owner_id.value) {
      ; ({ data: profilsData, error: profilsError } = await supabase.from('profils').select('*').eq('owner_id', owner_id.value))
      if (profilsError) console.error('[Store] Erreur chargement profils:', profilsError)
      if (profilsData) profils.value = profilsData as unknown as Profil[]

        ; ({ data: articlesData, error: articlesError } = await supabase.from('articles').select('*').eq('owner_id', owner_id.value))
      if (articlesError) console.error('[Store] Erreur chargement articles:', articlesError)
      if (articlesData) articles.value = articlesData as unknown as Article[]

        ; ({ data: organisationsData, error: organisationsError } = await supabase.from('organisations').select('*, lookup:type_id(id, code, description, classe:classe_id(id, code,description))').eq('owner_id', owner_id.value))
      if (organisationsError) console.error('[Store] Erreur chargement organisations:', organisationsError)
      if (organisationsData) organisations.value = organisationsData as unknown as Organisation[]

        ; ({ data: invoicesData, error: invoicesError } = await supabase.from('invoices').select('*').eq('owner_id', owner_id.value))
      if (invoicesError) console.error('[Store] Erreur chargement invoices:', invoicesError)
      if (invoicesData) invoiceHeaders.value = invoicesData as unknown as Facture[]

        ; ({ data: clientsData, error: clientsError } = await supabase.from('clients').select('*, type:type_id(*)').eq('owner_id', owner_id.value))
      if (clientsError) console.error('[Store] Erreur chargement clients:', clientsError)
      if (clientsData) clients.value = clientsData as unknown as Client[]

    }

    return {
      data: {
        lookups: lookupsData,
        classes: classesData,
        organisations: organisationsData,
        invoices: invoicesData,
        clients: clientsData,
        usersRoles: usersRolesData
      },
      error: lookupsError || classesError || profilsError || usersRolesError || organisationsError || clientsError || invoicesError || articlesError,
      loading: false
    }
  }

  return {
    lookups,
    classes,
    invoiceHeaders,
    organisations,
    profils,
    owner_id,
    usersRoles,
    affectations,
    articles,
    getClasseById,
    getClasseItems,
    getLookupsById,
    init,
    setOwnerID,
    getAffectations,
    getAffectationsMagasin,
    getTypeOrganisation,
    getModePaiement,
    getConditionPaiement,
    getDevise,
    getTypeAvoirs,
    getTypeClient,
    getEmplacements,
    getTypeFactures,
    getTypeArticles,
    getGroupeTaxation,
    getTypeOrganisations,
    clients
  }
})
