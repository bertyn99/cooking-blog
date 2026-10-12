import { sql, isNull } from 'drizzle-orm'
import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'
import type { AnySQLiteColumn } from 'drizzle-orm/sqlite-core'
import { articles } from './articles'
import { blobs } from './blobs'
import { users } from './users'

export const glossaryTerms = sqliteTable('glossary_terms', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  kind: text('kind', { enum: ['ingredient', 'technique', 'ustensile'] }).notNull(),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  parentId: integer('parent_id').references((): AnySQLiteColumn => glossaryTerms.id, { onDelete: 'set null' }),
  description: text('description'),
  content: text('content'),
  coverBlobPathname: text('cover_blob_pathname').references(() => blobs.pathname),
  coverAltText: text('cover_alt_text'),
  coverDescription: text('cover_description'),
  iconKey: text('icon_key'),
  utensilCategory: text('utensil_category', {
    enum: ['cuisson', 'preparation', 'mesure', 'electro', 'service'],
  }),
  brand: text('brand'),
  amazonAsin: text('amazon_asin'),
  partnerUrl: text('partner_url'),
  partnerName: text('partner_name'),
  relatedArticleId: integer('related_article_id').references(() => articles.id, { onDelete: 'set null' }),
  sortKey: text('sort_key').notNull(),
  status: text('status', { enum: ['draft', 'published'] }).default('draft').notNull(),
  publishedAt: text('published_at'),
  locale: text('locale').default('fr').notNull(),
  createdByUserId: integer('created_by_user_id').references(() => users.id, { onDelete: 'set null' }),
  updatedByUserId: integer('updated_by_user_id').references(() => users.id, { onDelete: 'set null' }),
  deletedAt: text('deleted_at'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
  uniqueIndex('glossary_terms_slug_locale_active_idx').on(table.slug, table.locale).where(isNull(table.deletedAt)),
  index('glossary_terms_kind_locale_sort_key_idx').on(table.kind, table.locale, table.sortKey),
  index('glossary_terms_status_idx').on(table.status),
  index('glossary_terms_deleted_at_idx').on(table.deletedAt),
  index('glossary_terms_related_article_id_idx').on(table.relatedArticleId),
  index('glossary_terms_parent_id_idx').on(table.parentId),
])

export const glossaryAliases = sqliteTable('glossary_aliases', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  glossaryTermId: integer('glossary_term_id').notNull().references(() => glossaryTerms.id, { onDelete: 'cascade' }),
  alias: text('alias').notNull(),
  aliasNormalized: text('alias_normalized').notNull(),
  locale: text('locale').default('fr').notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
  uniqueIndex('glossary_aliases_alias_locale_idx').on(table.aliasNormalized, table.locale),
  index('glossary_aliases_term_id_idx').on(table.glossaryTermId),
])
