import { defineStore } from 'pinia'

export const useParametresStore = defineStore('parametres', () => {
  const owner_id = ref<string | null>(null)

  function setOwnerID(id: string) {
    owner_id.value = id
  }

  async function init() {
    const lookupsStore = useLookupsStore()
    const organisationsStore = useOrganisationsStore()
    const articlesStore = useArticlesStore()
    const clientsStore = useClientsStore()
    const facturesStore = useFacturesStore()
    const profilsStore = useProfilsStore()

    const results = await Promise.allSettled([
      lookupsStore.fetchAll(),
      owner_id.value ? organisationsStore.fetchAll(owner_id.value) : Promise.resolve(),
      owner_id.value ? articlesStore.fetchAll(owner_id.value) : Promise.resolve(),
      owner_id.value ? clientsStore.fetchAll(owner_id.value) : Promise.resolve(),
      owner_id.value ? facturesStore.fetchAll(owner_id.value) : Promise.resolve(),
      owner_id.value ? profilsStore.fetchAll(owner_id.value) : Promise.resolve(),
    ])

    const errors = results.filter(r => r.status === 'rejected').map(r => (r as PromiseRejectedResult).reason)
    if (errors.length > 0) console.error('[Store] Erreurs init:', errors)

    return { error: errors.length > 0 ? errors : null, loading: false }
  }

  const lookups = computed(() => useLookupsStore().lookups)
  const classes = computed(() => useLookupsStore().classes)
  const organisations = computed(() => useOrganisationsStore().items)
  const articles = computed(() => useArticlesStore().items)
  const clients = computed(() => useClientsStore().items)
  const invoiceHeaders = computed(() => useFacturesStore().items)
  const profils = computed(() => useProfilsStore().items)

  const getClasseById = computed(() => (id: string) => classes.value.find(c => c.id === id)?.nom)
  const getLookupsById = computed(() => (id: string) => lookups.value.find(l => l.id == id)?.nom)

  const getTypeFactures = useLookupsStore().getTypeFactures
  const getTypeAvoirs = useLookupsStore().getTypeAvoirs
  const getModePaiement = useLookupsStore().getModePaiement
  const getConditionPaiement = useLookupsStore().getConditionPaiement
  const getDevise = useLookupsStore().getDevise
  const getTypeClient = useLookupsStore().getTypeClient
  const getTypeArticles = useLookupsStore().getTypeArticles
  const getTypeOrganisations = useLookupsStore().getTypeOrganisations
  const getGroupeTaxation = useLookupsStore().getGroupeTaxation
  const getEmplacements = useOrganisationsStore().getEmplacements

  const getClasseItems = computed(() => classes.value.map(c => ({ label: c.nom, id: c.id })))

  return {
    owner_id,
    lookups, classes, organisations, articles, clients, invoiceHeaders, profils,
    init, setOwnerID,
    getClasseById, getLookupsById, getClasseItems,
    getTypeFactures, getTypeAvoirs, getModePaiement, getConditionPaiement,
    getDevise, getTypeClient, getTypeArticles, getTypeOrganisations, getGroupeTaxation,
    getEmplacements,
  }
})
