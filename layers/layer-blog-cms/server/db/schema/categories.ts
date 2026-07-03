import { sql } from 'drizzle-orm'
import { sqliteTable, text, integer, uniqueIndex, index } from 'drizzle-orm/sqlite-core'

export const categories = sqliteTable('categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  desc: text('desc'),
  slug: text('slug').notNull(),
  locale: text('locale').default('fr').notNull(),
  localeGroupId: text('locale_group_id'),
  status: text('status', { enum: ['draft', 'published', 'scheduled'] }).default('published').notNull(),
  publishedAt: text('published_at'),
  deletedAt: text('deleted_at'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
  uniqueIndex('categories_slug_locale_idx').on(table.slug, table.locale),
  index('categories_status_idx').on(table.status),
  index('categories_locale_idx').on(table.locale),
  index('categories_locale_group_idx').on(table.localeGroupId),
])

export const categoryBlobs = sqliteTable('category_blobs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  categoryId: integer('category_id').notNull().references(() => categories.id, { onDelete: 'cascade' }),
  blobPathname: text('blob_pathname').notNull(),
  sortOrder: integer('sort_order'),
}, (table) => [
  index('category_blobs_category_id_idx').on(table.categoryId),
])

export const categoryArticles = sqliteTable('category_articles', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  locale: text('locale').default('fr').notNull(),
  localeGroupId: text('locale_group_id'),
  status: text('status', { enum: ['draft', 'published', 'scheduled'] }).default('published').notNull(),
  publishedAt: text('published_at'),
  deletedAt: text('deleted_at'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
  uniqueIndex('category_articles_slug_locale_idx').on(table.slug, table.locale),
  index('category_articles_status_idx').on(table.status),
  index('category_articles_locale_idx').on(table.locale),
  index('category_articles_locale_group_idx').on(table.localeGroupId),
])
