import { sql } from 'drizzle-orm'
import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core'
import { users } from './users'
import { apiKeys } from './api-keys'

export const auditEvents = sqliteTable('audit_events', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  actorUserId: integer('actor_user_id').references(() => users.id),
  actorApiKeyId: integer('actor_api_key_id').references(() => apiKeys.id),
  action: text('action').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id').notNull(),
  metadata: text('metadata', { mode: 'json' }),
  correlationId: text('correlation_id'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
  index('audit_events_entity_idx').on(table.entityType, table.entityId),
  index('audit_events_created_at_idx').on(table.createdAt),
  index('audit_events_actor_api_key_idx').on(table.actorApiKeyId),
  index('audit_events_actor_user_created_idx').on(table.actorUserId, table.createdAt),
])
