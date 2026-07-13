/**
 * Requires authentication on every `/api/admin/**` request (including GET).
 * Public `/api/**` routes remain published-only without auth.
 */
import {
  extractBearerToken,
  verifyJwt,
} from '../utils/auth'
import { createApiError } from '../utils/errors'

export default defineEventHandler(async (event) => {
  const path = event.path ?? ''
  if (!path.startsWith('/api/admin/')) {
    return
  }

  const authHeader = getRequestHeader(event, 'authorization')
  const token = extractBearerToken(authHeader)

  if (!token) {
    throw createApiError('UNAUTHORIZED', 'Authentication required')
  }

  const payload = await verifyJwt(token)
  if (!payload) {
    throw createApiError('UNAUTHORIZED', 'Invalid or expired token')
  }

  event.context.user = payload
})
