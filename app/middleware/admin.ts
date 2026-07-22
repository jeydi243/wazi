export default defineNuxtRouteMiddleware(async () => {
  const auth = useAuth()

  if (!auth.isAuthenticated.value) {
    return navigateTo('/auth')
  }

  const usersStore = useUsersStore()
  await usersStore.init()

  if (!auth.isAdmin.value) {
    return navigateTo('/')
  }
})
