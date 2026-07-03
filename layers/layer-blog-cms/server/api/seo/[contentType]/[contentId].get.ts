/**
 * GET /api/seo/:contentType/:contentId
 *
 * Returns the SEO metadata (with nested socialMeta) for a content item.
 *
 * - contentType: 'article' | 'recipe' | 'page'
 * - contentId: the numeric ID of the content item
 *
 * Response:
 * - 200 { data: { seo } }
 * - 404 if no SEO record exists for this content
 * - 400 if contentType is invalid
 */
import { createApiError } from '../../../utils/errors'
import { getSeoForContent } from '../../../utils/seo'

const VALID_CONTENT_TYPES = new Set(['article', 'recipe', 'page'])

export default defineEventHandler(async (event) => {
  const contentType = getRouterParam(event, 'contentType')
  const contentId = Number(getRouterParam(event, 'contentId'))

  if (!contentType || !VALID_CONTENT_TYPES.has(contentType)) {
    throw createApiError(
      'VALIDATION_ERROR',
      `Invalid contentType. Must be one of: ${[...VALID_CONTENT_TYPES].join(', ')}`
    )
  }

  if (!Number.isFinite(contentId) || contentId < 1) {
    throw createApiError('VALIDATION_ERROR', 'Invalid contentId')
  }

  const seo = await getSeoForContent(contentType, contentId)

  if (!seo) {
    throw createApiError('NOT_FOUND', 'No SEO metadata found for this content')
  }

  return { data: seo }
})
