import { z } from 'zod'
import { useQueries } from '../../utils/db'
import { requireEditor } from '../../utils/http-auth'
import { validateBody } from '../../utils/validate'
import { createApiError } from '../../utils/errors'
import { safeHrefSchema } from '../../utils/validations/safe-href'

const schema = z.object({
  fromPath: safeHrefSchema.optional(),
  toPath: safeHrefSchema.optional(),
  statusCode: z.number().int().min(300).max(399).optional(),
  locale: z.string().nullable().optional(),
})

export default defineEventHandler(async (event) => {
  await requireEditor(event)
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isFinite(id) || id < 1) {
    throw createApiError('VALIDATION_ERROR', 'Invalid redirect ID')
  }

  const { redirects } = useQueries(event)
  const existing = await redirects.findById(id)
  if (!existing) {
    throw createApiError('NOT_FOUND', 'Redirect not found')
  }

  const body = validateBody(schema, await readBody(event))
  const updated = await redirects.updateById(id, {
    ...body,
    updatedAt: new Date().toISOString(),
  })

  return { data: updated }
})
