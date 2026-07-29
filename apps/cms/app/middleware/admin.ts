export default defineNuxtRouteMiddleware(async () => {
  const { user, fetch, loggedIn } = useUserSession()

  if (!loggedIn.value) {
    await fetch()
  }

  if (user.value?.role !== 'admin') {
    return navigateTo('/')
  }
})
