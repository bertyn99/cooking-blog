import { sql } from 'drizzle-orm'
import { sqliteTable, text, integer, uniqueIndex } from 'drizzle-orm/sqlite-core'

export const legacyStrapiMap = sqliteTable('legacy_strapi_map', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sourceType: text('source_type').notNull(),
  sourceId: text('source_id').notNull(),
  destTable: text('dest_table').notNull(),
  destId: text('dest_id').notNull(),
  migratedAt: text('migrated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
  uniqueIndex('legacy_strapi_map_source_idx').on(table.sourceType, table.sourceId),
])
