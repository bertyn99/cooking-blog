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
  const existing = await categories.findRowById(id)

  if (!existing) {
    throw createApiError('NOT_FOUND', 'Category not found')
  }

  if (existing.deletedAt !== null) {
    throw createApiError('VALIDATION_ERROR', 'Category is already deleted')
  }

  const deletedAt = await categories.softDelete(id)

  return { data: { id, deletedAt } }
})
