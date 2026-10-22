import { resolveDbBackedUser } from '../utils/session-user'
import { defineNitroPlugin } from 'nitropack/runtime'

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('request', async (event) => {
    event.context.$authorization = {
      resolveServerUser: async () => resolveDbBackedUser(event),
    }
  })
})
