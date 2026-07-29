import { index, integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { recipes } from './recipes'

export const ingredients = sqliteTable('ingredients', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  recipeId: integer('recipe_id').notNull().references(() => recipes.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  qty: real('qty'),
  unit: text('unit', { enum: ['none', 'g', 'mg', 'kg', 'l', 'ml', 'cuillere_soupe', 'cuillere_cafe', 'tasse'] }).default('none'),
  sortOrder: integer('sort_order').default(0),
}, (table) => [
  index('ingredients_recipe_id_idx').on(table.recipeId),
])
