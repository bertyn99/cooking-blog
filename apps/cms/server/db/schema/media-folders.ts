import { sql } from 'drizzle-orm'
import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'

export const mediaFolders = sqliteTable('media_folders', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  pathPrefix: text('path_prefix').notNull(),
  parentId: integer('parent_id'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
  uniqueIndex('media_folders_path_prefix_idx').on(table.pathPrefix),
  index('media_folders_parent_id_idx').on(table.parentId),
])

export const contentMedia = sqliteTable('content_media', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  contentType: text('content_type', { enum: ['article', 'recipe', 'page'] }).notNull(),
  contentId: integer('content_id').notNull(),
  blobPathname: text('blob_pathname').notNull(),
  role: text('role', { enum: ['gallery', 'inline', 'attachment'] }).default('gallery').notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
  index('content_media_content_idx').on(table.contentType, table.contentId),
  index('content_media_blob_pathname_idx').on(table.blobPathname),
])
