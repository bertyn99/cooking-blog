import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'
import type { SeoQueryFilter } from '../db/query-types'

/**
 * Returns a Drizzle WHERE filter for the given contentType + contentId pair.
 *
 * Maps contentType to the corresponding nullable FK column on the `seo` table.
 * Throws if contentType is unrecognized.
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

/**
 * Fetches the SEO record for a content item, including nested socialMeta.
 *
 * Returns `null` if no SEO record exists for this content.
 */
export async function getSeoForContent(contentType: string, contentId: number) {
  const result = await db.query.seo.findFirst({
    where: getSeoQueryWhere(contentType, contentId),
    with: { socialMeta: true },
  })
  return result ?? null
}
