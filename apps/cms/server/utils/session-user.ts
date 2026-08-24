import type { H3Event } from 'nitro/h3'
import type { User } from '#auth-utils'
import { toSessionUser } from './auth/user'
import { createApiError } from './errors'
import { useKvStore } from './kv'
import { useQueries } from './db'

const REVOKE_TTL_SECONDS = 60 * 60 * 8

export function userAuthRevokeKey(userId: number) {
  return `user:auth:revoked:${userId}`
}

/** Invalidate existing sealed sessions for a user (next API call with old cookie fails). */
export async function bumpUserAuthRevocation(event: H3Event, userId: number) {
  const kv = useKvStore(event)
  await kv.set(userAuthRevokeKey(userId), Date.now(), { ttl: REVOKE_TTL_SECONDS })
}

async function assertSessionNotRevoked(
  event: H3Event,
  userId: number,
  loggedInAt: number | undefined,
) {
  if (loggedInAt === undefined) return
  const revokedAt = await useKvStore(event).get<number>(userAuthRevokeKey(userId))
  if (revokedAt != null && loggedInAt < revokedAt) {
    throw createApiError(
      'UNAUTHORIZED',
      'Session expirée. Reconnectez-vous.',
      undefined,
      { fix: 'Vos droits ou votre compte ont été modifiés.' },
    )
  }
}

/**
 * Load the user from DB for the current session cookie.
 * Throws when the account is missing, inactive, or revoked after login.
 */
export async function resolveDbBackedUser(event: H3Event): Promise<User | null> {
  const session = await getUserSession(event)
  const userId = session.user?.id
  if (!userId) return null

  await assertSessionNotRevoked(event, userId, session.loggedInAt)

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

  if (row.role === 'agent') {
    return null
  }

  const freshUser = toSessionUser(row)
  session.user = freshUser
  return freshUser
}

/** Sync session cookie user with DB (for middleware). */
export async function syncSessionUserFromDb(event: H3Event): Promise<User | null> {
  return resolveDbBackedUser(event)
}
