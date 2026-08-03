import { sql, isNull } from 'drizzle-orm'
import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'

export const tags = sqliteTable('tags', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  locale: text('locale').default('fr').notNull(),
  deletedAt: text('deleted_at'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
  uniqueIndex('tags_slug_locale_active_idx').on(table.slug, table.locale).where(isNull(table.deletedAt)),
  index('tags_deleted_at_idx').on(table.deletedAt),
])

export const contentTags = sqliteTable('content_tags', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  contentType: text('content_type', { enum: ['article', 'recipe', 'page'] }).notNull(),
  contentId: integer('content_id').notNull(),
  tagId: integer('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
  uniqueIndex('content_tags_unique_idx').on(table.contentType, table.contentId, table.tagId),
  index('content_tags_content_idx').on(table.contentType, table.contentId),
  index('content_tags_tag_id_idx').on(table.tagId),
])
