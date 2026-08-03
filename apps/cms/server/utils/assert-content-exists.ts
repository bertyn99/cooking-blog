import type { DbQueries } from '../db/queries'
import { queryNotFound } from '../db/query-errors'

export async function assertContentRowExists(
  queries: DbQueries,
  contentType: 'article' | 'recipe' | 'page',
  contentId: number,
) {
  if (contentType === 'article') {
    const row = await queries.articles.findRowById(contentId)
    if (!row) {
      throw queryNotFound('Article not found')
    }
    return
  }

  if (contentType === 'recipe') {
    const row = await queries.recipes.findRowById(contentId)
    if (!row) {
      throw queryNotFound('Recipe not found')
    }
    return
  }

  const row = await queries.pages.findRowById(contentId)
  if (!row) {
    throw queryNotFound('Page not found')
  }
}
