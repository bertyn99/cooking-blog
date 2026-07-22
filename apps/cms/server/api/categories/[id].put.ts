import { updateRecipeCategorySchema } from '../../utils/validations/categories'
import { validateBody } from '../../utils/validate'
import { createApiError } from '../../utils/errors'
import { canEditContent } from '../../../shared/abilities'
import { useQueries } from '../../utils/db'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  await authorize(event, canEditContent)

  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isFinite(id) || id < 1) {
    throw createApiError('VALIDATION_ERROR', 'Invalid category ID')
  }

  const { categories } = useQueries(event)
  const body = validateBody(updateRecipeCategorySchema, await readBody(event))

  if (!(await categories.existsById(id))) {
    throw createApiError('NOT_FOUND', 'Category not found')
  }

  const now = new Date().toISOString()

  const updated = await categories.updateById(id, {
    name: body.name,
    desc: body.desc,
    slug: body.slug,
    locale: body.locale,
    localeGroupId: body.localeGroupId,
    status: body.status,
    publishedAt: body.publishedAt,
    updatedAt: now,
  })

  if (!updated) {
    throw createApiError('INTERNAL_ERROR', 'Failed to update category')
  }

  return { data: updated }
})
