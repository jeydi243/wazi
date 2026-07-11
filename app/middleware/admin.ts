export default defineNuxtRouteMiddleware(async () => {
  const user = useSupabaseUser()
  if (!user.value) {
    return navigateTo('/auth')
  }

  const usersStore = useUsersStore()
  await usersStore.init()
  const hasAdminRole = usersStore.usersRoles?.some((ur: any) => ur.role?.code === 'admin')
  if (!hasAdminRole) {
    return navigateTo('/')
  }
})
