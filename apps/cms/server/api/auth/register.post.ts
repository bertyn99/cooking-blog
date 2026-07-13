/**
 * POST /api/auth/register
 */
import { z } from 'zod'
import { count, eq } from 'drizzle-orm'
import type { AppDb } from '../../db/create-db'
import { schema } from '../../db/create-db'
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
import { useDb } from '../../utils/db'

const registerSchema = z.object({
  email: z.string().email().max(255).toLowerCase(),
  username: z.string().min(1).max(100).optional(),
  password: z.string().min(8).max(512),
  role: z.enum(['admin', 'editor']).optional()
})

export async function isBootstrapMode(db: AppDb): Promise<boolean> {
  const [row] = await db
    .select({ value: count() })
    .from(schema.users)
  const total = Number(row?.value ?? 0)
  return total === 0
}

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
  const db = useDb(event)

  const bootstrap = await isBootstrapMode(db)

  if (!bootstrap) {
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

  const existing = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.email, email))
    .limit(1)
  if (existing.length > 0) {
    throw createApiError('VALIDATION_ERROR', 'Email is already registered')
  }

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
