import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const seo = sqliteTable('seo', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  articleId: integer('article_id'),
  recipeId: integer('recipe_id'),
  pageId: integer('page_id'),
  description: text('description'),
  keywords: text('keywords'),
  metaRobots: text('meta_robots').default('index, follow'),
})
