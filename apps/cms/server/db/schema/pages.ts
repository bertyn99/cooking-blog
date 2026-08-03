import { sql, isNull } from 'drizzle-orm'
import { sqliteTable, text, integer, uniqueIndex, index } from 'drizzle-orm/sqlite-core'
import type { AnySQLiteColumn } from 'drizzle-orm/sqlite-core'
import { users } from './users'

export const pages = sqliteTable('pages', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  title: text('title'),
  slug: text('slug').notNull(),
  content: text('content'),
  excerpt: text('excerpt'),
  parentId: integer('parent_id').references((): AnySQLiteColumn => pages.id, { onDelete: 'set null' }),
  status: text('status', { enum: ['draft', 'published', 'scheduled'] }).default('draft').notNull(),
  firstPublishedAt: text('first_published_at'),
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
  uniqueIndex('pages_slug_locale_active_idx').on(table.slug, table.locale).where(isNull(table.deletedAt)),
  index('pages_status_idx').on(table.status),
  index('pages_locale_idx').on(table.locale),
  index('pages_locale_group_idx').on(table.localeGroupId),
  index('pages_parent_id_idx').on(table.parentId),
  index('pages_deleted_at_idx').on(table.deletedAt),
])
