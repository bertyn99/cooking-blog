import { eq } from 'drizzle-orm'
import { Hash } from '@adonisjs/hash'
import { Scrypt } from '@adonisjs/hash/drivers/scrypt'
import type { User } from '#auth-utils'
import type { AppDb } from '../create-db'
import { schema } from '../create-db'
import { toSessionUser } from '../../utils/auth/user'

export const AGENT_USER_EMAIL = 'agent@journalducuistot.internal'

const hasher = new Hash(new Scrypt({}))

/**
 * Ensures the system agent user exists (idempotent).
 * Used as authorship principal for all API-key / MCP writes.
 */
export async function ensureAgentUser(db: AppDb): Promise<User> {
  const existing = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, AGENT_USER_EMAIL))
    .limit(1)

  if (existing[0]) {
    return toSessionUser(existing[0])
  }

  const passwordHash = await hasher.make(crypto.randomUUID())

  try {
    const inserted = await db
      .insert(schema.users)
      .values({
        email: AGENT_USER_EMAIL,
        username: 'Agent IA',
        passwordHash,
        role: 'agent',
        isActive: true,
      })
      .returning()

    const user = inserted[0]
    if (!user) {
      throw new Error('Failed to create agent user')
    }
    return toSessionUser(user)
  }
  catch {
    const retry = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, AGENT_USER_EMAIL))
      .limit(1)

    if (retry[0]) {
      return toSessionUser(retry[0])
    }
    throw new Error('Failed to ensure agent user')
  }
}

export async function seedAgentUser(db: AppDb): Promise<{ created: boolean, user: User }> {
  const before = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.email, AGENT_USER_EMAIL))
    .limit(1)

  const user = await ensureAgentUser(db)
  return {
    created: before.length === 0,
    user,
  }
}
