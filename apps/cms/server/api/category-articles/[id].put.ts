import { updateArticleCategorySchema } from '../../utils/validations/categories'
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

  const { categoryArticles } = useQueries(event)
  const body = validateBody(updateArticleCategorySchema, await readBody(event))

  if (!(await categoryArticles.existsById(id))) {
    throw createApiError('NOT_FOUND', 'Category not found')
  }

  const now = new Date().toISOString()

  const updated = await categoryArticles.updateById(id, {
    name: body.name,
    slug: body.slug,
    locale: body.locale,
    localeGroupId: body.localeGroupId,
    status: body.status,
    publishedAt: body.publishedAt,
    updatedAt: now,
  })

  if (!updated) {
    throw createApiError('INTERNAL_ERROR', 'Failed to update article category')
  }

  return { data: updated }
})
