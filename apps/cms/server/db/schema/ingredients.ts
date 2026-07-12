import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'

export const ingredients = sqliteTable('ingredients', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  recipeId: integer('recipe_id').notNull(),
  name: text('name').notNull(),
  qty: real('qty'),
  unit: text('unit', { enum: ['none', 'g', 'mg', 'kg', 'l', 'ml', 'cuillere_soupe', 'cuillere_cafe', 'tasse'] }).default('none'),
  sortOrder: integer('sort_order').default(0),
})
