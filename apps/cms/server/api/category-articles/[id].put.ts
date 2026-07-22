import { updateArticleCategorySchema } from '../../utils/validations/categories'
import { validateBody } from '../../utils/validate'
import { createApiError } from '../../utils/errors'
import { useQueries } from '../../utils/db'
import { requireEditor } from '../../utils/http-auth'
import { applyContentStatusPolicy } from '../../utils/content-status-policy'

export default defineEventHandler(async (event) => {
  const session = await requireEditor(event)

  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isFinite(id) || id < 1) {
    throw createApiError('VALIDATION_ERROR', 'Invalid category ID')
  }

  const { categoryArticles } = useQueries(event)
  const body = validateBody(updateArticleCategorySchema, await readBody(event))

  const existing = await categoryArticles.findRowById(id)
  if (!existing) {
    throw createApiError('NOT_FOUND', 'Category not found')
  }

  const now = new Date().toISOString()
  const statusFields = applyContentStatusPolicy(session.user, existing, {
    status: body.status,
    publishedAt: body.publishedAt,
  })

  const updated = await categoryArticles.updateById(id, {
    name: body.name,
    slug: body.slug,
    locale: body.locale,
    localeGroupId: body.localeGroupId,
    status: statusFields.status ?? body.status,
    publishedAt: statusFields.publishedAt ?? body.publishedAt,
    updatedAt: now,
  })

  if (!updated) {
    throw createApiError('INTERNAL_ERROR', 'Failed to update article category')
  }

  return { data: updated }
})
