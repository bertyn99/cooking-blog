import { z } from 'zod'
import { useQueries } from '../../utils/db'
import { requireEditor } from '../../utils/http-auth'
import { validateBody } from '../../utils/validate'
import { createApiError } from '../../utils/errors'

const updateTagSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().optional(),
  locale: z.string().optional(),
})

export default defineEventHandler(async (event) => {
  await requireEditor(event)

  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isFinite(id) || id < 1) {
    throw createApiError('VALIDATION_ERROR', 'Invalid tag ID')
  }

  const { tags } = useQueries(event)
  const existing = await tags.findById(id)
  if (!existing) {
    throw createApiError('NOT_FOUND', 'Tag not found')
  }

  const body = validateBody(updateTagSchema, await readBody(event))
  const updated = await tags.updateById(id, {
    ...body,
    updatedAt: new Date().toISOString(),
  })

  return { data: updated }
})
