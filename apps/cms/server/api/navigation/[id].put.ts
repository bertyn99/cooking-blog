import { z } from 'zod'
import { useQueries } from '../../utils/db'
import { requireEditor } from '../../utils/http-auth'
import { validateBody } from '../../utils/validate'
import { createApiError } from '../../utils/errors'
import { safeHrefSchema } from '../../utils/validations/safe-href'

const schema = z.object({
  label: z.string().min(1).optional(),
  href: safeHrefSchema.optional(),
  parentId: z.number().int().positive().nullable().optional(),
  sortOrder: z.number().int().optional(),
  locale: z.string().optional(),
  localeGroupId: z.string().nullable().optional(),
})

export default defineEventHandler(async (event) => {
  await requireEditor(event)
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isFinite(id) || id < 1) {
    throw createApiError('VALIDATION_ERROR', 'Invalid navigation item ID')
  }

  const { navigation } = useQueries(event)
  const existing = await navigation.findById(id)
  if (!existing) {
    throw createApiError('NOT_FOUND', 'Navigation item not found')
  }

  const body = validateBody(schema, await readBody(event))
  const updated = await navigation.updateById(id, {
    ...body,
    updatedAt: new Date().toISOString(),
  })

  return { data: updated }
})
