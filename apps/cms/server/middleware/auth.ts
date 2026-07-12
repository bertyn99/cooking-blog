/**
 * Auth middleware — enforces JWT authentication on mutating API requests.
 *
 * Rules:
 * - Runs only on `/api/**` routes.
 * - Skips `GET`, `HEAD`, `OPTIONS` (public read; draft filtering handled
 *   by individual CRUD endpoints).
 * - Skips `/api/auth/**` (login/register/session handle their own auth).
 * - Skips `/api/health` (public health check).
 * - For all other POST/PUT/PATCH/DELETE on `/api/**`, requires a valid
 *   Bearer JWT in the `Authorization` header.
 * - On success, attaches the decoded payload to `event.context.user` so
 *   downstream handlers can call `requireRole(event, [...])`.
 * - On failure, returns 401 with a descriptive error.
 */
import {
  extractBearerToken,
  verifyJwt
} from '../utils/auth'
import { createApiError } from '../utils/errors'

const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

/**
 * Routes whose auth is handled by the endpoint itself and must NOT be
 * blocked by this middleware.
 *
 * - `/api/auth/login`: obviously must accept unauthenticated traffic.
 * - `/api/auth/register`: bootstrap mode allows first admin without a token.
 * - `/api/auth/session`: returns 401 itself when no token is present.
 */
const PUBLIC_API_PREFIXES = ['/api/auth/']

/**
 * Exact-match public paths (health check).
 */
const PUBLIC_API_PATHS = new Set(['/api/health'])

export default defineEventHandler(async (event) => {
  const path = event.path ?? ''
  const method = event.method ?? ''

  // Only consider /api/** routes.
  if (!path.startsWith('/api/')) return

  // Read-only methods bypass auth.
  // (CRUD endpoints are responsible for filtering drafts on GET.)
  if (!WRITE_METHODS.has(method.toUpperCase())) return

  // Auth endpoints + health are public.
  if (PUBLIC_API_PATHS.has(path)) return
  if (PUBLIC_API_PREFIXES.some(prefix => path.startsWith(prefix))) return

  // Verify the Bearer token.
  const authHeader = getRequestHeader(event, 'authorization')
  const token = extractBearerToken(authHeader)

  if (!token) {
    throw createApiError('UNAUTHORIZED', 'Authentication required')
  }

  const payload = await verifyJwt(token)
  if (!payload) {
    throw createApiError('UNAUTHORIZED', 'Invalid or expired token')
  }

  // Make the decoded payload available to downstream handlers.
  event.context.user = payload
})
