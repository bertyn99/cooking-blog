import { resolveDbBackedUser } from '../utils/session-user'

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('request', async (event) => {
    event.context.$authorization = {
      resolveServerUser: async () => resolveDbBackedUser(event),
    }
  })
})
