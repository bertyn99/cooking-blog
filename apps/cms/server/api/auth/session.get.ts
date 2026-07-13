/**
 * GET /api/auth/session
 *
 * Validates the Bearer token in the `Authorization` header and returns the
 * sanitized user object. Returns 401 if the token is missing, malformed,
 * expired, or refers to a user that no longer exists.
 *
 * Header: `Authorization: Bearer <token>`
 * Response: { user: SafeUser }
 */
import { eq } from 'drizzle-orm'
import { schema } from '../../db/create-db'
import {
  extractBearerToken,
  sanitizeUser,
  verifyJwt
} from '../../utils/auth'
import { createApiError } from '../../utils/errors'
import { useDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const authHeader = getRequestHeader(event, 'authorization')
  const token = extractBearerToken(authHeader)

  if (!token) {
    throw createApiError('UNAUTHORIZED', 'Missing or malformed Authorization header')
  }

  const payload = await verifyJwt(token)
  if (!payload) {
    throw createApiError('UNAUTHORIZED', 'Invalid or expired token')
  }

  const db = useDb(event)
  const rows = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, payload.sub))
    .limit(1)

  const user = rows[0]
  if (!user) {
    throw createApiError('UNAUTHORIZED', 'User no longer exists')
  }

  // Attach for any downstream consumer.
  event.context.user = payload

  return { user: sanitizeUser(user) }
})
