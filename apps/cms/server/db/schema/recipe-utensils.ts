import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

/** Kitchen tools / equipment needed for a recipe (affiliation-friendly). */
export const recipeUtensils = sqliteTable('recipe_utensils', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  recipeId: integer('recipe_id').notNull(),
  name: text('name').notNull(),
  /** Optional detail, e.g. "28 cm" or "ou équivalent". */
  note: text('note'),
  /** Affiliate or product URL (Amazon, etc.). */
  affiliateUrl: text('affiliate_url'),
  sortOrder: integer('sort_order').default(0),
})
