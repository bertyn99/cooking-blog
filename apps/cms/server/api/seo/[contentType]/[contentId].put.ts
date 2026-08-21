import { createApiError } from '../../../utils/errors'
import { requireWriteActor } from '../../../utils/write-auth'
import { validateBody } from '../../../utils/validate'
import {
  seoBodySchema,
  upsertSeoMutation,
} from '../../../services/seo-mutations'
import type { SeoContentType } from '../../../db/queries/seo'

const VALID_CONTENT_TYPES = new Set(['article', 'recipe', 'page'])

const CONTENT_SCOPE: Record<SeoContentType, 'articles' | 'recipes' | 'pages'> = {
  article: 'articles',
  recipe: 'recipes',
  page: 'pages',
}

export default defineEventHandler(async (event) => {
  const contentType = getRouterParam(event, 'contentType') as SeoContentType
  const contentId = Number(getRouterParam(event, 'contentId'))

  if (!contentType || !VALID_CONTENT_TYPES.has(contentType)) {
    throw createApiError(
      'VALIDATION_ERROR',
      `Invalid contentType. Must be one of: ${[...VALID_CONTENT_TYPES].join(', ')}`,
    )
  }

  if (!Number.isFinite(contentId) || contentId < 1) {
    throw createApiError('VALIDATION_ERROR', 'Invalid contentId')
  }

  const actor = await requireWriteActor(event, CONTENT_SCOPE[contentType])
  const body = validateBody(seoBodySchema, await readBody(event))
  const seo = await upsertSeoMutation(event, actor, contentType, contentId, body)
  return { data: seo }
})
