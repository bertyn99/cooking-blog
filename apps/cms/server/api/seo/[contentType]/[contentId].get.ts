import { createApiError } from '../../../utils/errors'
import { useQueries } from '../../../utils/db'
import type { SeoContentType } from '../../../db/queries/seo'

const VALID_CONTENT_TYPES = new Set(['article', 'recipe', 'page'])

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

  const seo = await useQueries(event).seo.findByContent(contentType, contentId)

  if (!seo) {
    throw createApiError('NOT_FOUND', 'No SEO metadata found for this content')
  }

  return { data: seo }
})
