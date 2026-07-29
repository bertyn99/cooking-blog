import { z } from 'zod'
import { useQueries } from '../../utils/db'
import { requireEditor } from '../../utils/http-auth'
import { validateBody } from '../../utils/validate'
import { createApiError } from '../../utils/errors'
import { safeHrefSchema } from '../../utils/validations/safe-href'

const schema = z.object({
  fromPath: safeHrefSchema,
  toPath: safeHrefSchema,
  statusCode: z.number().int().min(300).max(399).optional(),
  locale: z.string().nullable().optional(),
})

export default defineEventHandler(async (event) => {
  await requireEditor(event)
  const body = validateBody(schema, await readBody(event))
  const now = new Date().toISOString()
  const row = await useQueries(event).redirects.insert({
    fromPath: body.fromPath,
    toPath: body.toPath,
    statusCode: body.statusCode ?? 301,
    locale: body.locale ?? null,
    createdAt: now,
    updatedAt: now,
  })

  if (!row) {
    throw createApiError('INTERNAL_ERROR', 'Failed to create redirect')
  }

  setResponseStatus(event, 201)
  return { data: row }
})
