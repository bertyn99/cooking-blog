import { sql } from 'drizzle-orm'
import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core'
import { recipes } from './recipes'

export const reviews = sqliteTable('reviews', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  recipeId: integer('recipe_id').notNull().references(() => recipes.id, { onDelete: 'cascade' }),
  star: integer('star'),
  content: text('content'),
  authorName: text('author_name'),
  status: text('status', { enum: ['pending', 'approved', 'rejected'] }).default('pending').notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
  index('idx_reviews_recipe_id').on(table.recipeId),
  index('idx_reviews_status').on(table.status),
])
