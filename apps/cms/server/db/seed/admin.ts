import { count, eq } from 'drizzle-orm'
import { Hash } from '@adonisjs/hash'
import { Scrypt } from '@adonisjs/hash/drivers/scrypt'
import type { AppDb } from '../create-db'
import { schema } from '../create-db'
import type { User } from '#auth-utils'
import { toSessionUser } from '../../utils/auth/user'

// Same Scrypt driver nuxt-auth-utils uses internally, so hashes produced here
// are verifiable by the auto-imported `verifyPassword` in the login handler.
// Imported directly (rather than via the nuxt-auth-utils auto-import) so the
// offline tsx seed script and unit tests work without the Nitro context.
const hasher = new Hash(new Scrypt({}))

export interface SeedAdminOptions {
  email: string
  password: string
  username?: string | null
  /** Skip when any admin user already exists. Default: true */
  skipIfAdminExists?: boolean
}

export interface SeedAdminResult {
  created: boolean
  skipped: boolean
  reason?: string
  user?: User
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export async function countUsers(db: AppDb): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(schema.users)
  return Number(row?.value ?? 0)
}

export async function hasAdminUser(db: AppDb): Promise<boolean> {
  const [row] = await db
    .select({ value: count() })
    .from(schema.users)
    .where(eq(schema.users.role, 'admin'))
  return Number(row?.value ?? 0) > 0
}

/**
 * Creates the initial admin user when none exists.
 * Idempotent by default: skips when an admin is already present.
 */
export async function seedAdmin(
  db: AppDb,
  options: SeedAdminOptions
): Promise<SeedAdminResult> {
  const email = normalizeEmail(options.email)
  const skipIfAdminExists = options.skipIfAdminExists ?? true

  if (options.password.length < 8) {
    throw new Error('ADMIN_PASSWORD must be at least 8 characters')
  }

  if (skipIfAdminExists && await hasAdminUser(db)) {
    return {
      created: false,
      skipped: true,
      reason: 'An admin user already exists'
    }
  }

  const existing = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, email))
    .limit(1)

  const found = existing[0]
  if (found) {
    if (found.role === 'admin') {
      return {
        created: false,
        skipped: true,
        reason: `Admin already exists for ${email}`,
        user: toSessionUser(found)
      }
    }

    throw new Error(`Email ${email} is already registered with role "${found.role}"`)
  }

  const passwordHash = await hasher.make(options.password)

  const inserted = await db
    .insert(schema.users)
    .values({
      email,
      username: options.username ?? null,
      passwordHash,
      role: 'admin'
    })
    .returning()

  const user = inserted[0]
  if (!user) {
    throw new Error('Failed to create admin user')
  }

  return {
    created: true,
    skipped: false,
    user: toSessionUser(user)
  }
}
