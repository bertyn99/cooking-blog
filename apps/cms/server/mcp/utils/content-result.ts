import type { H3Event } from 'h3'
import { useQueries } from '../../utils/db'
import { createApiError } from '../../utils/errors'
import { withMcpContentLinks } from './preview'

export async function mcpArticleResult(event: H3Event, id: number) {
  const row = await useQueries(event).articles.findById(id, ['category', 'seo'], 'admin')
  if (!row) {
    throw createApiError('NOT_FOUND', 'Article introuvable.')
  }
  return withMcpContentLinks(event, 'article', row, { liveEditable: true })
}

export async function mcpPageResult(event: H3Event, id: number) {
  const row = await useQueries(event).pages.findById(id, ['seoMeta', 'parent'], 'admin')
  if (!row) {
    throw createApiError('NOT_FOUND', 'Page introuvable.')
  }
  return withMcpContentLinks(event, 'page', row, { liveEditable: true })
}

export async function mcpRecipeResult(event: H3Event, id: number) {
  const row = await useQueries(event).recipes.findById(
    id,
    'admin',
    ['category', 'ingredients', 'steps', 'nutrition', 'utensils', 'seo'],
  )
  if (!row) {
    throw createApiError('NOT_FOUND', 'Recette introuvable.')
  }
  return withMcpContentLinks(event, 'recipe', row)
}
