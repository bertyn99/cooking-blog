import { resolveDbBackedUser } from '../utils/session-user'

export default defineNitroPlugin(() => {
  sessionHooks.hook('fetch', async (session, event) => {
    const userId = session.user?.id
    if (!userId) {
      return
    }

    session.user = (await resolveDbBackedUser(event)) ?? undefined
  })
})
