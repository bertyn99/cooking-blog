/**
 * POST /api/auth/register
 *
 * Creates a new user. Two modes:
 *
 * 1. **Bootstrap mode** — when `SELECT COUNT(*) FROM users = 0`, registration
 *    is allowed without authentication. The first user is created with role
 *    `admin`. This is the only way to bootstrap the system.
 *
 * 2. **Admin-only mode** — once at least one user exists, registration
 *    requires a valid admin JWT (any non-admin caller receives 403).
 *    Default role for new users is `editor`.
 *
 * Body: { email: string, username?: string, password: string, role?: 'admin' | 'editor' }
 * Response: { token: string, user: SafeUser }
 */
import { z } from 'zod'
import { count, eq } from 'drizzle-orm'
import { db, schema } from 'hub:db'
import type { H3Event } from 'h3'
import {
  extractBearerToken,
  hashPassword,
  sanitizeUser,
  signJwt,
  verifyJwt,
  type UserRole
} from '../../utils/auth'
import { createApiError } from '../../utils/errors'

const registerSchema = z.object({
  email: z.string().email().max(255).toLowerCase(),
  username: z.string().min(1).max(100).optional(),
  password: z.string().min(8).max(512),
  role: z.enum(['admin', 'editor']).optional()
})

/**
 * Returns true if the users table is empty (bootstrap mode).
 */
export async function isBootstrapMode(): Promise<boolean> {
  const [row] = await db
    .select({ value: count() })
    .from(schema.users)
  const total = Number(row?.value ?? 0)
  return total === 0
}

/**
 * Extracts and validates the Bearer token from the request, returning the
 * JWT payload if valid. Returns null if no token is present or it's invalid.
 */
async function getAuthenticatedUser(event: H3Event) {
  const auth = getRequestHeader(event, 'authorization')
  const token = extractBearerToken(auth)
  if (!token) return null
  return verifyJwt(token)
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = registerSchema.safeParse(body)
  if (!parsed.success) {
    throw createApiError(
      'VALIDATION_ERROR',
      'Invalid registration payload',
      parsed.error.flatten()
    )
  }
  const { email, username, password, role } = parsed.data

  const bootstrap = await isBootstrapMode()

  if (!bootstrap) {
    // Require an admin JWT for all subsequent registrations.
    const payload = await getAuthenticatedUser(event)
    if (!payload) {
      throw createApiError('UNAUTHORIZED', 'Valid authentication required')
    }
    if (payload.role !== 'admin') {
      throw createApiError(
        'FORBIDDEN',
        'Only admins can register new users',
        { requiredRole: 'admin', actualRole: payload.role }
      )
    }
  }

  // Reject duplicate emails.
  const existing = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.email, email))
    .limit(1)
  if (existing.length > 0) {
    throw createApiError('VALIDATION_ERROR', 'Email is already registered')
  }

  // Resolve role: bootstrap forces 'admin'; otherwise default to 'editor'.
  const resolvedRole: UserRole = bootstrap
    ? 'admin'
    : (role ?? 'editor')

  const passwordHash = await hashPassword(password)

  const inserted = await db
    .insert(schema.users)
    .values({
      email,
      username: username ?? null,
      passwordHash,
      role: resolvedRole
    })
    .returning()

  const newUser = inserted[0]
  if (!newUser) {
    throw createApiError('INTERNAL_ERROR', 'Failed to create user')
  }

  const token = await signJwt({
    sub: newUser.id,
    email: newUser.email,
    role: newUser.role
  })

  return {
    token,
    user: sanitizeUser(newUser),
    bootstrap
  }
})
