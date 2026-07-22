export default defineNuxtRouteMiddleware((to) => {
  const auth = useAuth()

  if (auth.isAuthenticated.value) {
    return
  }

  if (to.path === '/auth' || to.path === '/confirm') {
    return
  }

  return navigateTo('/auth')
})
