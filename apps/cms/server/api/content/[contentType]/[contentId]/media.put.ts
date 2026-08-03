import { z } from 'zod'
import { useQueries } from '../../../../utils/db'
import { requireEditor } from '../../../../utils/http-auth'
import { validateBody } from '../../../../utils/validate'
import { createApiError, fromQueryError } from '../../../../utils/errors'
import type { ContentMediaType } from '../../../../db/queries/media-folders'
import { assertContentRowExists } from '../../../../utils/assert-content-exists'

const schema = z.object({
  items: z.array(z.object({
    blobPathname: z.string().min(1),
    role: z.enum(['gallery', 'inline', 'attachment']).optional(),
    sortOrder: z.number().int().optional(),
  })),
})

const VALID = new Set<ContentMediaType>(['article', 'recipe', 'page'])

export default defineEventHandler(async (event) => {
  await requireEditor(event)

  const contentType = getRouterParam(event, 'contentType') as ContentMediaType
  const contentId = Number(getRouterParam(event, 'contentId'))
  if (!VALID.has(contentType) || !Number.isFinite(contentId) || contentId < 1) {
    throw createApiError('VALIDATION_ERROR', 'Invalid content reference')
  }

  const queries = useQueries(event)
  try {
    await assertContentRowExists(queries, contentType, contentId)
  }
  catch (error) {
    fromQueryError(error)
  }

  const body = validateBody(schema, await readBody(event))
  const { mediaFolders } = queries
  await mediaFolders.replaceContentMedia(contentType, contentId, body.items)
  const items = await mediaFolders.listContentMedia(contentType, contentId)
  return { data: items }
})
