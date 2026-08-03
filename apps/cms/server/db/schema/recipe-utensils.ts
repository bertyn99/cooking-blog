import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { recipes } from './recipes'

/** Kitchen tools / equipment needed for a recipe (affiliation-friendly). */
export const recipeUtensils = sqliteTable('recipe_utensils', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  recipeId: integer('recipe_id').notNull().references(() => recipes.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  /** Optional detail, e.g. "28 cm" or "ou équivalent". */
  note: text('note'),
  /** Affiliate or product URL (Amazon, etc.). */
  affiliateUrl: text('affiliate_url'),
  sortOrder: integer('sort_order').default(0),
}, (table) => [
  index('recipe_utensils_recipe_id_idx').on(table.recipeId),
])
