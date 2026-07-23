import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { recipes } from './recipes'

export const recipeSteps = sqliteTable('recipe_steps', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  recipeId: integer('recipe_id').notNull().references(() => recipes.id, { onDelete: 'cascade' }),
  title: text('title'),
  instruction: text('instruction').notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
}, (table) => [
  index('recipe_steps_recipe_id_idx').on(table.recipeId),
])
