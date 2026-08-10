import { sql } from 'drizzle-orm'
import { integer, sqliteTable, text, index } from 'drizzle-orm/sqlite-core'
import { users } from './users'
import type { ApiKeyScope } from '../../../shared/api-keys'

export const apiKeys = sqliteTable('api_keys', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  /** Public prefix for UI lists (e.g. `jdc_abcd1234`). */
  keyPrefix: text('key_prefix').notNull(),
  /** SHA-256 hex of `pepper:secret` — never store plaintext. */
  keyHash: text('key_hash').notNull().unique(),
  scopes: text('scopes', { mode: 'json' }).$type<ApiKeyScope[]>().notNull(),
  createdByUserId: integer('created_by_user_id').references(() => users.id, {
    onDelete: 'set null',
  }),
  expiresAt: text('expires_at'),
  revokedAt: text('revoked_at'),
  lastUsedAt: text('last_used_at'),
  lastUsedIp: text('last_used_ip'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
}, table => [
  index('api_keys_prefix_idx').on(table.keyPrefix),
  index('api_keys_revoked_idx').on(table.revokedAt),
])
