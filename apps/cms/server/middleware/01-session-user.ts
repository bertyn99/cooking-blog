import { toSessionUser } from '../utils/auth/user'
import { useQueries } from '../utils/db'
import { createApiError } from '../utils/errors'

const PUBLIC_API_PATHS = new Set([
  '/api/auth/login',
  '/api/health',
])

export default defineEventHandler(async (event) => {
  const path = event.path.split('?')[0] ?? event.path
  if (!path.startsWith('/api/')) return
  if (PUBLIC_API_PATHS.has(path)) return

  const session = await getUserSession(event)
  const userId = session.user?.id
  if (!userId) return

  const row = await useQueries(event).users.findById(userId)
  if (!row) {
    throw createApiError('UNAUTHORIZED', 'Session invalide.')
  }

  if (!row.isActive) {
    throw createApiError(
      'FORBIDDEN',
      'Ce compte a été désactivé.',
      undefined,
      { fix: 'Contactez un administrateur.' },
    )
  }

  const freshUser = toSessionUser(row)
  session.user = freshUser
})
