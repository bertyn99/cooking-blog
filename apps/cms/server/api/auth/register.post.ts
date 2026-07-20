/**
 * POST /api/auth/register
 *
 * The first user (bootstrap mode) is created without authentication and
 * becomes admin. Every subsequent registration requires an authenticated
 * admin (`canManageUsers`).
 */
import { count, eq } from 'drizzle-orm'
import type { AppDb } from '../../db/create-db'
import { schema } from '../../db/create-db'
import { registerSchema } from '../../../shared/validators/auth'
import { toSessionUser } from '../../utils/auth/user'
import { canManageUsers } from '../../../shared/abilities'
import { createApiError } from '../../utils/errors'
import { useDb } from '../../utils/db'

export async function isBootstrapMode(db: AppDb): Promise<boolean> {
  const [row] = await db
    .select({ value: count() })
    .from(schema.users)
  const total = Number(row?.value ?? 0)
  return total === 0
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = registerSchema.safeParse(body)
  if (!parsed.success) {
    throw createApiError(
      'VALIDATION_ERROR',
      'Invalid registration payload',
      parsed.error.flatten(),
    )
  }
  const { email, username, password, role } = parsed.data
  const db = useDb(event)

  const bootstrap = await isBootstrapMode(db)

  if (!bootstrap) {
    await requireUserSession(event)
    await authorize(event, canManageUsers)
  }

  const existing = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.email, email))
    .limit(1)
  if (existing.length > 0) {
    throw createApiError('VALIDATION_ERROR', 'Email is already registered')
  }

  const resolvedRole: 'admin' | 'editor' = bootstrap ? 'admin' : (role ?? 'editor')

  const passwordHash = await hashPassword(password)

  const inserted = await db
    .insert(schema.users)
    .values({
      email,
      username: username ?? null,
      passwordHash,
      role: resolvedRole,
    })
    .returning()

  const newUser = inserted[0]
  if (!newUser) {
    throw createApiError('INTERNAL_ERROR', 'Failed to create user')
  }

  const safeUser = toSessionUser(newUser)

  if (bootstrap) {
    await setUserSession(event, {
      user: safeUser,
      loggedInAt: Date.now(),
    })
  }

  return {
    user: safeUser,
    bootstrap,
  }
})
