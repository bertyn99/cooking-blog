import { sql } from 'drizzle-orm'
import { sqliteTable, text, integer, uniqueIndex, index } from 'drizzle-orm/sqlite-core'

export const articles = sqliteTable('articles', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  content: text('content'),
  slug: text('slug').notNull(),
  coverBlobPathname: text('cover_blob_pathname'),
  categoryId: integer('category_id'),
  firstPublishedAt: text('first_published_at'),
  status: text('status', { enum: ['draft', 'published', 'scheduled'] }).default('draft').notNull(),
  publishedAt: text('published_at'),
  scheduledAt: text('scheduled_at'),
  locale: text('locale').default('fr').notNull(),
  localeGroupId: text('locale_group_id'),
  deletedAt: text('deleted_at'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
  uniqueIndex('articles_slug_locale_idx').on(table.slug, table.locale),
  index('articles_status_idx').on(table.status),
  index('articles_locale_idx').on(table.locale),
  index('articles_locale_group_idx').on(table.localeGroupId),
  index('articles_published_at_idx').on(table.publishedAt),
])
