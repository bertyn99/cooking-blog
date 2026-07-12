export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path === '/login') return

  const { token, user, fetchSession } = useAuth()

  if (!token.value) {
    return navigateTo('/login')
  }

  if (!user.value) {
    const session = await fetchSession()
    if (!session) {
      return navigateTo('/login')
    }
  }
})
