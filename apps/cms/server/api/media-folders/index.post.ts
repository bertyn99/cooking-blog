import { z } from 'zod'
import { useQueries } from '../../utils/db'
import { requireEditor } from '../../utils/http-auth'
import { validateBody } from '../../utils/validate'
import { createApiError } from '../../utils/errors'

const schema = z.object({
  name: z.string().min(1),
  pathPrefix: z.string().min(1),
  parentId: z.number().int().positive().nullable().optional(),
})

export default defineEventHandler(async (event) => {
  await requireEditor(event)
  const body = validateBody(schema, await readBody(event))
  const now = new Date().toISOString()
  const row = await useQueries(event).mediaFolders.insert({
    name: body.name,
    pathPrefix: body.pathPrefix.replace(/\/+$/, ''),
    parentId: body.parentId ?? null,
    createdAt: now,
    updatedAt: now,
  })

  if (!row) {
    throw createApiError('INTERNAL_ERROR', 'Failed to create media folder')
  }

  setResponseStatus(event, 201)
  return { data: row }
})
