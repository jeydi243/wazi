export function useAuth() {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()
  const toast = useToast()
  const parametresStore = useParametresStore()

  const isAuthenticated = computed(() => !!user.value)
  const isAdmin = computed(() => {
    const usersStore = useUsersStore()
    return usersStore.usersRoles?.some((ur: any) => ur.role?.code === 'admin') ?? false
  })

  async function login(tenant: string, email: string, password: string) {
    const { data: profil } = await supabase
      .from('profils')
      .select('*, owner:owner_id(*)')
      .eq('owner.nom', tenant)

    if (!profil?.length) {
      toast.add({
        title: 'Erreur de connexion',
        description: `Le tenant "${tenant}" n'a pas été trouvé. Veuillez vérifier vos informations.`,
        color: 'error',
      })
      return null
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      toast.add({
        title: 'Erreur de connexion',
        description: error.message,
        color: 'error',
      })
      return null
    }

    if (data.user) {
      parametresStore.setOwnerID(profil[0]?.owner_id || '')
      await navigateTo('/')
      toast.add({
        title: 'Connexion réussie',
        description: `Bienvenue ${data.user.email || ''} !`,
        color: 'success',
      })
    }

    return data.user
  }

  async function loginWithPasskey() {
    const { data, error } = await supabase.auth.signInWithPasskey()

    if (error) {
      toast.add({ title: 'Erreur', description: error.message, color: 'error' })
      return null
    }

    if (data?.user) {
      await navigateTo('/')
      toast.add({ title: 'Connexion réussie', description: 'Bienvenue via Passkey !', color: 'success' })
    }

    return data?.user ?? null
  }

  async function logout() {
    const currentUser = user.value
    const { error } = await supabase.auth.signOut()

    if (error) {
      toast.add({ title: 'Erreur', description: error.message, color: 'error' })
      return
    }

    await navigateTo('/auth')
    toast.add({
      title: `Au revoir ${currentUser?.email || ''} !`,
      description: 'Vous êtes déconnecté.',
      color: 'warning',
    })
  }

  async function register(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({ email, password })

    if (error) {
      toast.add({ title: 'Erreur', description: error.message, color: 'error' })
      return null
    }

    return data.user
  }

  return {
    user,
    isAuthenticated,
    isAdmin,
    login,
    loginWithPasskey,
    logout,
    register,
  }
}
