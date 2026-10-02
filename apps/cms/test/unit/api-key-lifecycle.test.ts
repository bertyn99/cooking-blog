import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { relations } from '../../server/db/relations'
import { createApiKeyQueries } from '../../server/db/queries/api-keys'
import { generateApiKeySecret } from '../../server/utils/api-key-crypto'

function createTestDb() {
  const client = createClient({ url: ':memory:' })
  const db = drizzle({ client, relations })

  client.executeMultiple(`
    CREATE TABLE api_keys (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      name TEXT NOT NULL,
      key_prefix TEXT NOT NULL,
      key_hash TEXT NOT NULL UNIQUE,
      scopes TEXT NOT NULL,
      created_by_user_id INTEGER,
      expires_at TEXT,
      revoked_at TEXT,
      last_used_at TEXT,
      last_used_ip TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
    );
  `)

  return db
}

describe('api key lifecycle queries', () => {
  let db: ReturnType<typeof createTestDb>
  let queries: ReturnType<typeof createApiKeyQueries>

  beforeEach(() => {
    db = createTestDb()
    queries = createApiKeyQueries(db)
  })

  afterEach(async () => {
    await db.$client.close()
  })

  it('rotates secret on active keys only', async () => {
    const first = generateApiKeySecret()
    const row = await queries.insert({
      name: 'agent',
      keyPrefix: first.keyPrefix,
      keyHash: first.keyHash,
      scopes: ['articles', 'recipes', 'pages', 'write'],
    })
    expect(row).toBeTruthy()

    await queries.touchUsage(row!.id, '127.0.0.1')
    const next = generateApiKeySecret()
    const rotated = await queries.rotateSecret(row!.id, next.keyPrefix, next.keyHash)

    expect(rotated?.keyPrefix).toBe(next.keyPrefix)
    expect(rotated?.keyHash).toBe(next.keyHash)
    expect(rotated?.scopes).toEqual(['articles', 'recipes', 'pages', 'write'])
    expect(rotated?.lastUsedAt).toBeNull()
    expect(rotated?.lastUsedIp).toBeNull()

    await queries.revoke(row!.id)
    expect(await queries.rotateSecret(row!.id, first.keyPrefix, first.keyHash)).toBeUndefined()
  })

  it('updates scopes on active keys only', async () => {
    const generated = generateApiKeySecret()
    const row = await queries.insert({
      name: 'agent',
      keyPrefix: generated.keyPrefix,
      keyHash: generated.keyHash,
      scopes: ['pages', 'write'],
    })
    expect(row).toBeTruthy()

    const updated = await queries.updateScopes(row!.id, ['articles', 'recipes', 'pages', 'write'])
    expect(updated?.scopes).toEqual(['articles', 'recipes', 'pages', 'write'])

    await queries.revoke(row!.id)
    expect(await queries.updateScopes(row!.id, ['write'])).toBeUndefined()
  })

  it('deletes revoked keys only', async () => {
    const generated = generateApiKeySecret()
    const row = await queries.insert({
      name: 'old',
      keyPrefix: generated.keyPrefix,
      keyHash: generated.keyHash,
      scopes: ['write'],
    })
    expect(row).toBeTruthy()

    expect(await queries.deleteRevoked(row!.id)).toBeUndefined()

    await queries.revoke(row!.id)
    const deleted = await queries.deleteRevoked(row!.id)
    expect(deleted?.id).toBe(row!.id)
    expect(await queries.findById(row!.id)).toBeUndefined()
  })
})
