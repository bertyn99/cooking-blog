import { resolveDbBackedUser } from '../utils/session-user'
import { definePlugin } from 'nitro'

export default definePlugin((nitroApp) => {
  nitroApp.hooks.hook('request', async (event) => {
    event.context.$authorization = {
      resolveServerUser: async () => resolveDbBackedUser(event),
    }
  })
})
