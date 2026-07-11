export default defineNuxtRouteMiddleware((to) => {
  const user = useSupabaseUser()

  if (user.value) {
    return
  }

  if (to.path === '/auth' || to.path === '/confirm') {
    return
  }

  return navigateTo('/auth')
})
