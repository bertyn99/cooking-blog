export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('request', async (event) => {
    event.context.$authorization = {
      resolveServerUser: async () => {
        const { user } = await getUserSession(event)
        return user ?? null
      },
    }
  })
})
