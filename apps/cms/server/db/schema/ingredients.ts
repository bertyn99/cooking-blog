import { index, integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { glossaryTerms } from './glossary-terms'
import { recipes } from './recipes'

export const ingredients = sqliteTable('ingredients', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  recipeId: integer('recipe_id').notNull().references(() => recipes.id, { onDelete: 'cascade' }),
  glossaryTermId: integer('glossary_term_id').notNull().references(() => glossaryTerms.id, { onDelete: 'restrict' }),
  qty: real('qty'),
  unit: text('unit', { enum: ['none', 'g', 'mg', 'kg', 'l', 'ml', 'cuillere_soupe', 'cuillere_cafe', 'tasse'] }).default('none'),
  note: text('note'),
  sortOrder: integer('sort_order').default(0),
}, (table) => [
  index('ingredients_recipe_id_idx').on(table.recipeId),
  index('ingredients_glossary_term_id_idx').on(table.glossaryTermId),
])
