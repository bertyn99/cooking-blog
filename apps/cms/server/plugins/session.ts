import { toSessionUser } from '../utils/auth/user'
import { useQueries } from '../utils/db'

export default defineNitroPlugin(() => {
  sessionHooks.hook('fetch', async (session, event) => {
    const userId = session.user?.id
    if (!userId) {
      return
    }

    const user = await useQueries(event).users.findById(userId)
    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'User no longer exists',
      })
    }

    session.user = toSessionUser(user)
  })
})
