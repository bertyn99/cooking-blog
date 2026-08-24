import { resolveDbBackedUser } from '../utils/session-user'
import { definePlugin } from 'nitro'

export default definePlugin(() => {
  sessionHooks.hook('fetch', async (session, event) => {
    const userId = session.user?.id
    if (!userId) {
      return
    }

    session.user = (await resolveDbBackedUser(event)) ?? undefined
  })
})
