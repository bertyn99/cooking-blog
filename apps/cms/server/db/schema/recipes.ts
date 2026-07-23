import { sql, isNull } from 'drizzle-orm'
import { sqliteTable, text, integer, uniqueIndex, index } from 'drizzle-orm/sqlite-core'
import { blobs } from './blobs'
import { categories } from './categories'
import { users } from './users'

export const recipes = sqliteTable('recipes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  intro: text('intro'),
  slug: text('slug').notNull(),
  coverBlobPathname: text('cover_blob_pathname').references(() => blobs.pathname),
  coverAltText: text('cover_alt_text'),
  coverDescription: text('cover_description'),
  categoryId: integer('category_id').references(() => categories.id),
  step: text('step'),
  difficulty: text('difficulty', { enum: ['easy', 'medium', 'hard'] }).default('easy'),
  time: integer('time'),
  firstPublishedAt: text('first_published_at'),
  status: text('status', { enum: ['draft', 'published', 'scheduled'] }).default('draft').notNull(),
  publishedAt: text('published_at'),
  scheduledAt: text('scheduled_at'),
  locale: text('locale').default('fr').notNull(),
  localeGroupId: text('locale_group_id'),
  version: integer('version').default(1).notNull(),
  createdByUserId: integer('created_by_user_id').references(() => users.id, { onDelete: 'set null' }),
  updatedByUserId: integer('updated_by_user_id').references(() => users.id, { onDelete: 'set null' }),
  deletedAt: text('deleted_at'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
  uniqueIndex('recipes_slug_locale_active_idx').on(table.slug, table.locale).where(isNull(table.deletedAt)),
  index('recipes_status_idx').on(table.status),
  index('recipes_locale_idx').on(table.locale),
  index('recipes_locale_group_idx').on(table.localeGroupId),
  index('recipes_published_at_idx').on(table.publishedAt),
  index('recipes_deleted_at_idx').on(table.deletedAt),
  index('recipes_category_id_idx').on(table.categoryId),
])
