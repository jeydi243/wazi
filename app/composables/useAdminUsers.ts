import * as z from 'zod'

export function useAdminUsers() {
  const toast = useToast()
  const { copy } = useClipboard()
  const searchInput = ref('')

  const openCreate = ref(false)
  const openEdit = ref(false)
  const openConfirmDelete = ref(false)
  const openInvite = ref(false)
  const openDetail = ref(false)
  const selectedUser = ref<any>(null)
  const userToDelete = ref<any>(null)
  const actionLoading = ref(false)
  const detailUser = ref<any>(null)
  const detailFactors = ref<any[]>([])

  const { data: users, pending, refresh } = await useLazyAsyncData('admin-users', () => $fetch('/api/users'))

  const filteredUsers = computed(() => {
    if (!searchInput.value) return users.value || []
    const q = searchInput.value.toLowerCase()
    return (users.value || []).filter((u: any) =>
      u.email?.toLowerCase().includes(q) || u.id?.toLowerCase().includes(q) || u.phone?.includes(q))
  })

  const stats = computed(() => {
    const list = users.value || []
    const total = list.length
    const confirmed = list.filter((u: any) => u.email_confirmed_at).length
    const unconfirmed = total - confirmed
    const banned = list.filter((u: any) => u.banned_until).length
    const active = list.filter((u: any) => {
      if (!u.last_sign_in_at) return false
      return new Date(u.last_sign_in_at).toDateString() === new Date().toDateString()
    }).length
    return { total, confirmed, unconfirmed, banned, active }
  })

  const createSchema = z.object({ email: z.string().email('Email invalide'), password: z.string().min(6, '6 caractères minimum') })
  type CreateSchema = z.output<typeof createSchema>
  const createState = reactive<Partial<CreateSchema>>({ email: '', password: '' })

  async function onCreateSubmit(event: { data: CreateSchema }) {
    actionLoading.value = true
    try {
      await $fetch('/api/users', { method: 'POST', body: { email: event.data.email, password: event.data.password, email_confirm: true } })
      toast.add({ title: 'Succès', description: 'Utilisateur créé avec succès.', color: 'success' })
      openCreate.value = false
      createState.email = ''; createState.password = ''
      await refresh()
    } catch (err: any) {
      toast.add({ title: 'Erreur', description: err.data?.statusMessage || err.message, color: 'error' })
    } finally { actionLoading.value = false }
  }

  const editSchema = z.object({
    email: z.string().email('Email invalide').optional().or(z.literal('')),
    password: z.string().min(6, '6 caractères minimum').optional().or(z.literal('')),
    phone: z.string().optional().or(z.literal('')),
    email_confirm: z.boolean().optional(),
  })
  type EditSchema = z.output<typeof editSchema>
  const editState = reactive<Partial<EditSchema>>({ email: '', password: '', phone: '', email_confirm: true })

  function openEditModal(user: any) {
    selectedUser.value = user
    editState.email = user.email || ''
    editState.password = ''
    editState.phone = user.phone || ''
    editState.email_confirm = !!user.email_confirmed_at
    openEdit.value = true
  }

  async function onEditSubmit(event: { data: EditSchema }) {
    if (!selectedUser.value) return
    const body: any = {}
    if (event.data.email && event.data.email !== selectedUser.value.email) body.email = event.data.email
    if (event.data.password) body.password = event.data.password
    if (event.data.phone && event.data.phone !== selectedUser.value.phone) body.phone = event.data.phone
    body.email_confirm = event.data.email_confirm !== false
    if (!body.email && !body.password && !body.phone && (!event.data.email_confirm || body.email_confirm === !!selectedUser.value.email_confirmed_at)) {
      toast.add({ title: 'Info', description: 'Aucune modification.', color: 'warning' })
      return
    }
    actionLoading.value = true
    try {
      await $fetch(`/api/users/${selectedUser.value.id}`, { method: 'PUT', body })
      toast.add({ title: 'Succès', description: 'Utilisateur mis à jour.', color: 'success' })
      openEdit.value = false; selectedUser.value = null
      await refresh()
    } catch (err: any) {
      toast.add({ title: 'Erreur', description: err.data?.statusMessage || err.message, color: 'error' })
    } finally { actionLoading.value = false }
  }

  function confirmDelete(user: any) { userToDelete.value = user; openConfirmDelete.value = true }

  async function handleDelete() {
    if (!userToDelete.value) return
    actionLoading.value = true
    try {
      await $fetch(`/api/users/${userToDelete.value.id}`, { method: 'DELETE' })
      toast.add({ title: 'Supprimé', description: 'Utilisateur supprimé définitivement.', color: 'success' })
      openConfirmDelete.value = false; userToDelete.value = null
      await refresh()
    } catch (err: any) {
      toast.add({ title: 'Erreur', description: err.data?.statusMessage || err.message, color: 'error' })
    } finally { actionLoading.value = false }
  }

  async function toggleBan(user: any) {
    const isBanned = !!user.banned_until
    actionLoading.value = true
    try {
      await $fetch(`/api/users/${user.id}/ban`, { method: 'PUT', body: { ban: !isBanned } })
      toast.add({ title: isBanned ? 'Débanni' : 'Banni', description: `Utilisateur ${user.email} ${isBanned ? 'débanni' : 'banni'} avec succès.`, color: 'success' })
      await refresh()
    } catch (err: any) {
      toast.add({ title: 'Erreur', description: err.data?.statusMessage || err.message, color: 'error' })
    } finally { actionLoading.value = false }
  }

  const inviteSchema = z.object({ email: z.string().email('Email invalide'), redirectTo: z.string().optional().or(z.literal('')) })
  type InviteSchema = z.output<typeof inviteSchema>
  const inviteState = reactive<Partial<InviteSchema>>({ email: '', redirectTo: '' })

  function openInviteModal(user?: any) {
    inviteState.email = user?.email || ''
    inviteState.redirectTo = ''
    openInvite.value = true
  }

  async function onInviteSubmit(event: { data: InviteSchema }) {
    actionLoading.value = true
    try {
      await $fetch('/api/users/invite', { method: 'POST', body: { email: event.data.email, redirectTo: event.data.redirectTo || undefined } })
      toast.add({ title: 'Succès', description: `Invitation envoyée à ${event.data.email}.`, color: 'success' })
      openInvite.value = false; inviteState.email = ''; inviteState.redirectTo = ''
      await refresh()
    } catch (err: any) {
      toast.add({ title: 'Erreur', description: err.data?.statusMessage || err.message, color: 'error' })
    } finally { actionLoading.value = false }
  }

  async function generateRecoveryLink(user: any) {
    actionLoading.value = true
    try {
      const result: any = await $fetch('/api/users/generate-link', { method: 'POST', body: { type: 'recovery', email: user.email } })
      await copy(result?.action_link || '')
      toast.add({ title: 'Lien copié', description: 'Le lien de réinitialisation a été copié.', color: 'success' })
    } catch (err: any) {
      toast.add({ title: 'Erreur', description: err.data?.statusMessage || err.message, color: 'error' })
    } finally { actionLoading.value = false }
  }

  async function generateMagicLink(user: any) {
    actionLoading.value = true
    try {
      const result: any = await $fetch('/api/users/generate-link', { method: 'POST', body: { type: 'magiclink', email: user.email } })
      await copy(result?.action_link || '')
      toast.add({ title: 'Lien magique copié', description: 'Le lien magique a été copié dans le presse-papier.', color: 'success' })
    } catch (err: any) {
      toast.add({ title: 'Erreur', description: err.data?.statusMessage || err.message, color: 'error' })
    } finally { actionLoading.value = false }
  }

  async function openDetailModal(user: any) {
    actionLoading.value = true; detailUser.value = user; detailFactors.value = []
    try {
      detailUser.value = await $fetch(`/api/users/${user.id}`)
      try { detailFactors.value = await $fetch(`/api/users/${user.id}/factors`) } catch { detailFactors.value = [] }
    } catch { detailUser.value = user }
    finally { actionLoading.value = false; openDetail.value = true }
  }

  function formatDate(date: string | null) {
    if (!date) return '—'
    return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  function formatDateShort(date: string | null) {
    if (!date) return '—'
    return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  function getMetaJson(obj: any) {
    if (!obj) return '—'
    try { return JSON.stringify(obj, null, 2) } catch { return String(obj) }
  }

  function getRowItems(row: any): any[] {
    const user = row.original
    const isBanned = !!user.banned_until
    return [[
      { type: 'label', label: user.email || 'Utilisateur' },
      { type: 'separator' },
      { label: "Copier l'ID", icon: 'i-lucide-copy', onSelect: () => copy(user.id) },
      { label: 'Détails', icon: 'i-lucide-eye', onSelect: () => openDetailModal(user) },
      { type: 'separator' },
      { label: 'Modifier', icon: 'i-lucide-pencil', onSelect: () => openEditModal(user) },
      { label: 'Inviter par email', icon: 'i-lucide-mail-plus', onSelect: () => openInviteModal(user) },
      { type: 'separator' },
      { label: 'Lien de réinitialisation', icon: 'i-lucide-key-round', onSelect: () => generateRecoveryLink(user) },
      { label: 'Lien magique', icon: 'i-lucide-sparkles', onSelect: () => generateMagicLink(user) },
      { type: 'separator' },
      { label: isBanned ? 'Débannir' : 'Bannir', icon: isBanned ? 'i-lucide-check-circle' : 'i-lucide-ban', color: isBanned ? 'success' : 'warning', onSelect: () => toggleBan(user) },
      { type: 'separator' },
      { label: 'Supprimer', icon: 'i-lucide-trash', color: 'error', onSelect: () => confirmDelete(user) },
    ]]
  }

  return {
    searchInput, filteredUsers, stats, users, pending, refresh,
    openCreate, openEdit, openConfirmDelete, openInvite, openDetail,
    selectedUser, userToDelete, actionLoading, detailUser, detailFactors,
    createSchema, createState, onCreateSubmit,
    editSchema, editState, openEditModal, onEditSubmit,
    confirmDelete, handleDelete, toggleBan,
    inviteSchema, inviteState, openInviteModal, onInviteSubmit,
    generateRecoveryLink, generateMagicLink, openDetailModal,
    formatDate, formatDateShort, getMetaJson, getRowItems,
  }
}
