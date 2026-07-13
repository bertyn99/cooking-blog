import { createApiError } from '../../../utils/errors'
import { getSeoForContent } from '../../../utils/seo'
import { useDb } from '../../../utils/db'

const VALID_CONTENT_TYPES = new Set(['article', 'recipe', 'page'])

export default defineEventHandler(async (event) => {
  const contentType = getRouterParam(event, 'contentType')
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

  const db = useDb(event)
  const seo = await getSeoForContent(db, contentType, contentId)

  if (!seo) {
    throw createApiError('NOT_FOUND', 'No SEO metadata found for this content')
  }

  return { data: seo }
})
