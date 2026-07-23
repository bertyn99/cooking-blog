import { sql } from 'drizzle-orm'
import { sqliteTable, text, integer, index, uniqueIndex } from 'drizzle-orm/sqlite-core'
import { users } from './users'

export const contentRevisions = sqliteTable('content_revisions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  contentType: text('content_type').notNull(),
  contentId: integer('content_id').notNull(),
  version: integer('version').notNull(),
  snapshot: text('snapshot', { mode: 'json' }).notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  createdByUserId: integer('created_by_user_id').references(() => users.id),
  reason: text('reason', { enum: ['save', 'publish', 'restore', 'autosave'] }).notNull(),
}, (table) => [
  index('content_revisions_entity_idx').on(table.contentType, table.contentId),
  uniqueIndex('content_revisions_version_idx').on(table.contentType, table.contentId, table.version),
])
