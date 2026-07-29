import { z } from 'zod'
import { createApiError, fromQueryError } from '../../../utils/errors'
import { canEditContent } from '../../../../shared/abilities'
import { useQueries } from '../../../utils/db'
import type { SeoContentType } from '../../../db/queries/seo'

const socialMetaSchema = z.object({
  socialNetwork: z.enum(['Facebook', 'Twitter']),
  title: z.string().optional(),
  description: z.string().optional(),
  imageBlobPathname: z.string().optional(),
})

const seoBodySchema = z.object({
  description: z.string().optional(),
  keywords: z.string().optional(),
  canonicalUrl: z.string().url().optional().or(z.literal('')),
  metaRobots: z.string().optional(),
  socialMeta: z.array(socialMetaSchema).optional(),
})

const VALID_CONTENT_TYPES = new Set(['article', 'recipe', 'page'])

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  await authorize(event, canEditContent)

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

  const rawBody = await readBody(event)
  const parseResult = seoBodySchema.safeParse(rawBody)
  if (!parseResult.success) {
    throw createApiError(
      'VALIDATION_ERROR',
      'Invalid request body',
      parseResult.error.flatten(),
    )
  }

  try {
    const seo = await useQueries(event).seo.upsertForContent(contentType, contentId, parseResult.data)
    return { data: seo }
  }
  catch (error) {
    fromQueryError(error)
  }
})
