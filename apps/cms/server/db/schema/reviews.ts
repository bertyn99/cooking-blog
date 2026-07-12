import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core'

export const reviews = sqliteTable('reviews', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  recipeId: integer('recipe_id').notNull(),
  star: integer('star'),
  content: text('content'),
  authorName: text('author_name'),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
}, (table) => [
  index('idx_reviews_recipe_id').on(table.recipeId),
])
