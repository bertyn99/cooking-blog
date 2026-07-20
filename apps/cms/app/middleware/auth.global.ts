export default defineNuxtRouteMiddleware(async (to) => {
  // Don't guard non-page requests (assets, service workers, devtools
  // internals, API). Letting these fall through to a natural 404 is important:
  // a stale service worker (e.g. left over from a previous dev session) only
  // gets unregistered by the browser when its script fetch returns 404 — a
  // 302 redirect keeps it alive and serving stale cached modules, which breaks
  // the app entry load and Nuxt DevTools.
  if (
    to.path.startsWith('/_nuxt/')
    || to.path.startsWith('/api/')
    || to.path.startsWith('/__')
    || /\.[^/]+$/.test(to.path) // anything with a file extension (e.g. /sw.js, /favicon.ico)
  ) {
    return
  }

  if (to.path === '/login') return

  const { loggedIn, ready, fetch } = useUserSession()

  if (!ready.value) {
    await fetch()
  }

  if (!loggedIn.value) {
    return navigateTo('/login')
  }
})
