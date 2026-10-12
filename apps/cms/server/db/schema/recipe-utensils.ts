import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { glossaryTerms } from './glossary-terms'
import { recipes } from './recipes'

/** Kitchen tools on a recipe. Affiliate lives on the glossary term, not this row. */
export const recipeUtensils = sqliteTable('recipe_utensils', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  recipeId: integer('recipe_id').notNull().references(() => recipes.id, { onDelete: 'cascade' }),
  glossaryTermId: integer('glossary_term_id').notNull().references(() => glossaryTerms.id, { onDelete: 'restrict' }),
  /** Optional detail, e.g. "28 cm" or "ou équivalent". */
  note: text('note'),
  sortOrder: integer('sort_order').default(0),
}, (table) => [
  index('recipe_utensils_recipe_id_idx').on(table.recipeId),
  index('recipe_utensils_glossary_term_id_idx').on(table.glossaryTermId),
])
