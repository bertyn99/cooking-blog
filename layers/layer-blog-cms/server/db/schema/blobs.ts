import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

export const blobs = sqliteTable('blobs', {
  pathname: text('pathname').primaryKey(),
  originalName: text('original_name'),
  mimeType: text('mime_type'),
  size: integer('size'),
  width: integer('width'),
  height: integer('height'),
  altText: text('alt_text'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
})
