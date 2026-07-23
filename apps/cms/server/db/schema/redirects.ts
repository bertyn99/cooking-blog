import { sql } from 'drizzle-orm'
import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'

export const redirects = sqliteTable('redirects', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  fromPath: text('from_path').notNull(),
  toPath: text('to_path').notNull(),
  statusCode: integer('status_code').default(301).notNull(),
  locale: text('locale'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
  uniqueIndex('redirects_from_path_locale_idx').on(table.fromPath, table.locale),
  index('redirects_from_path_idx').on(table.fromPath),
])
