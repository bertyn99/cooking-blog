export default defineNuxtPlugin(() => {
  const { token } = useAuth()

  const api = $fetch.create({
    onRequest({ options }) {
      if (!token.value) return

      const headers = new Headers(options.headers as HeadersInit)
      headers.set('Authorization', `Bearer ${token.value}`)
      options.headers = headers
    }
  })

  return {
    provide: {
      api
    }
  }
})
