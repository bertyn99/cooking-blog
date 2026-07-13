import { createCategoryQueries } from '../../db/queries/categories'
import { createApiError } from '../../utils/errors'
import { useDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isFinite(id) || id < 1) {
    throw createApiError('VALIDATION_ERROR', 'Invalid category ID')
  }

  const db = useDb(event)
  const category = await createCategoryQueries(db).findById(id, 'public')

  if (!category) {
    throw createApiError('NOT_FOUND', 'Category not found')
  }

  return { data: category }
})
