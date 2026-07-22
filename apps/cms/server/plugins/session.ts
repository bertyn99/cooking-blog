import { toSessionUser } from '../utils/auth/user'
import { useQueries } from '../utils/db'
import { createApiError } from '../utils/errors'

export default defineNitroPlugin(() => {
  sessionHooks.hook('fetch', async (session, event) => {
    const userId = session.user?.id
    if (!userId) {
      return
    }

    const user = await useQueries(event).users.findById(userId)
    if (!user) {
      throw createApiError('UNAUTHORIZED', 'Ce compte n’existe plus.')
    }

    if (!user.isActive) {
      throw createApiError(
        'FORBIDDEN',
        'Ce compte a été désactivé.',
        undefined,
        { fix: 'Contactez un administrateur.' },
      )
    }

    session.user = toSessionUser(user)
    attachRequestUser(event, session.user)
  })
})
