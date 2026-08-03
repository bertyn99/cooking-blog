import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { relations } from '../../server/db/relations'
import { hasAdminUser, seedAdmin } from '../../server/db/seed/admin'

function createTestDb() {
  const client = createClient({ url: ':memory:' })
  const db = drizzle({ client, relations })

  client.executeMultiple(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      username TEXT,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'editor' NOT NULL,
      is_active INTEGER DEFAULT 1 NOT NULL,
      deactivated_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
    );
  `)

  return db
}

describe('seedAdmin', () => {
  let db: ReturnType<typeof createTestDb>

  beforeEach(() => {
    db = createTestDb()
  })

  afterEach(async () => {
    await db.$client.close()
  })

  it('creates the first admin user', async () => {
    const result = await seedAdmin(db, {
      email: 'Admin@Example.com',
      password: 'password123',
      username: 'chef'
    })

    expect(result.created).toBe(true)
    expect(result.skipped).toBe(false)
    expect(result.user).toMatchObject({
      email: 'admin@example.com',
      username: 'chef',
      role: 'admin'
    })
    expect(await hasAdminUser(db)).toBe(true)
  })

  it('skips when an admin already exists', async () => {
    await seedAdmin(db, {
      email: 'first@example.com',
      password: 'password123'
    })

    const result = await seedAdmin(db, {
      email: 'second@example.com',
      password: 'password456'
    })

    expect(result.created).toBe(false)
    expect(result.skipped).toBe(true)
    expect(result.reason).toMatch(/already exists/i)
  })

  it('rejects passwords shorter than 8 characters', async () => {
    await expect(seedAdmin(db, {
      email: 'admin@example.com',
      password: 'short'
    })).rejects.toThrow(/at least 8 characters/i)
  })

  it('updates password when resetPassword is set for existing admin', async () => {
    await seedAdmin(db, {
      email: 'admin@example.com',
      password: 'password123',
    })

    const result = await seedAdmin(db, {
      email: 'admin@example.com',
      password: 'new-password-99',
      resetPassword: true,
    })

    expect(result.passwordUpdated).toBe(true)
    expect(result.skipped).toBe(false)
    expect(result.user?.email).toBe('admin@example.com')
  })
})
