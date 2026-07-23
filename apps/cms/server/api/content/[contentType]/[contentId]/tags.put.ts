import { z } from 'zod'
import { useQueries } from '../../../../utils/db'
import { requireEditor } from '../../../../utils/http-auth'
import { validateBody } from '../../../../utils/validate'
import { createApiError, fromQueryError } from '../../../../utils/errors'
import type { TaggableContentType } from '../../../../db/queries/tags'
import { assertContentRowExists } from '../../../../utils/assert-content-exists'

const bodySchema = z.object({
  tagIds: z.array(z.number().int().positive()),
})

const VALID = new Set<TaggableContentType>(['article', 'recipe', 'page'])

export default defineEventHandler(async (event) => {
  await requireEditor(event)

  const contentType = getRouterParam(event, 'contentType') as TaggableContentType
  const contentId = Number(getRouterParam(event, 'contentId'))

  if (!VALID.has(contentType)) {
    throw createApiError('VALIDATION_ERROR', 'Invalid content type')
  }
  if (!Number.isFinite(contentId) || contentId < 1) {
    throw createApiError('VALIDATION_ERROR', 'Invalid content ID')
  }

  const queries = useQueries(event)
  try {
    await assertContentRowExists(queries, contentType, contentId)
  }
  catch (error) {
    fromQueryError(error)
  }

  const body = validateBody(bodySchema, await readBody(event))
  await queries.tags.replaceForContent(contentType, contentId, body.tagIds)

  const tags = await queries.tags.listForContent(contentType, contentId)
  return { data: tags }
})
