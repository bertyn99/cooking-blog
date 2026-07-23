import { sql } from 'drizzle-orm'
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const navigationItems = sqliteTable('navigation_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  label: text('label').notNull(),
  href: text('href').notNull(),
  parentId: integer('parent_id'),
  sortOrder: integer('sort_order').default(0).notNull(),
  locale: text('locale').default('fr').notNull(),
  localeGroupId: text('locale_group_id'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
  index('navigation_items_parent_id_idx').on(table.parentId),
  index('navigation_items_locale_idx').on(table.locale),
])
