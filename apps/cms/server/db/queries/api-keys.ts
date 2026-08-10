import { and, desc, eq, isNull } from 'drizzle-orm'
import type { AppDb } from '../create-db'
import { apiKeys } from '../schema/api-keys'
import type { ApiKeyScope } from '../../../shared/api-keys'

export type ApiKeyRow = typeof apiKeys.$inferSelect

export type ApiKeyInsert = {
  name: string
  keyPrefix: string
  keyHash: string
  scopes: ApiKeyScope[]
  createdByUserId?: number | null
  expiresAt?: string | null
}

export function createApiKeyQueries(db: AppDb) {
  return {
    listActive() {
      return db
        .select()
        .from(apiKeys)
        .where(isNull(apiKeys.revokedAt))
        .orderBy(desc(apiKeys.createdAt))
        .all()
    },

    listAll() {
      return db.select().from(apiKeys).orderBy(desc(apiKeys.createdAt)).all()
    },

    findById(id: number) {
      return db.select().from(apiKeys).where(eq(apiKeys.id, id)).get()
    },

    findByHash(keyHash: string) {
      return db
        .select()
        .from(apiKeys)
        .where(and(eq(apiKeys.keyHash, keyHash), isNull(apiKeys.revokedAt)))
        .get()
    },

    insert(row: ApiKeyInsert) {
      return db.insert(apiKeys).values(row).returning().get()
    },

    revoke(id: number) {
      const now = new Date().toISOString()
      return db
        .update(apiKeys)
        .set({ revokedAt: now, updatedAt: now })
        .where(and(eq(apiKeys.id, id), isNull(apiKeys.revokedAt)))
        .returning()
        .get()
    },

    touchUsage(id: number, ip?: string | null) {
      const now = new Date().toISOString()
      return db
        .update(apiKeys)
        .set({
          lastUsedAt: now,
          ...(ip ? { lastUsedIp: ip } : {}),
          updatedAt: now,
        })
        .where(eq(apiKeys.id, id))
        .run()
    },
  }
}
