import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'
import { articles } from './articles'
import { pages } from './pages'
import { recipes } from './recipes'

export const seo = sqliteTable('seo', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  articleId: integer('article_id').references(() => articles.id, { onDelete: 'cascade' }),
  recipeId: integer('recipe_id').references(() => recipes.id, { onDelete: 'cascade' }),
  pageId: integer('page_id').references(() => pages.id, { onDelete: 'cascade' }),
  description: text('description'),
  keywords: text('keywords'),
  metaRobots: text('meta_robots').default('index, follow'),
}, (table) => [
  uniqueIndex('seo_article_id_idx').on(table.articleId),
  uniqueIndex('seo_recipe_id_idx').on(table.recipeId),
  uniqueIndex('seo_page_id_idx').on(table.pageId),
])
