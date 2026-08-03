import { eq } from 'drizzle-orm'
import type { AppDb } from '../db/create-db'
import { schema } from '../db/create-db'
import type { SeoQueryFilter } from '../db/query-types'

/**
 * Returns a Drizzle WHERE filter for the given contentType + contentId pair.
 */
export function getSeoFilter(contentType: string, contentId: number) {
  switch (contentType) {
    case 'article': return eq(schema.seo.articleId, contentId)
    case 'recipe': return eq(schema.seo.recipeId, contentId)
    case 'page': return eq(schema.seo.pageId, contentId)
    default: throw new Error(`Invalid contentType: ${contentType}`)
  }
}

function getSeoQueryWhere(contentType: string, contentId: number): SeoQueryFilter {
  switch (contentType) {
    case 'article': return { articleId: contentId }
    case 'recipe': return { recipeId: contentId }
    case 'page': return { pageId: contentId }
    default: throw new Error(`Invalid contentType: ${contentType}`)
  }
}

export async function getSeoForContent(db: AppDb, contentType: string, contentId: number) {
  const result = await db.query.seo.findFirst({
    where: getSeoQueryWhere(contentType, contentId),
    with: { socialMeta: true },
  })
  return result ?? null
}
