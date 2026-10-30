import { createApiError } from '../../utils/errors'
import { useQueries } from '../../utils/db'
import { defineEventHandler, getRouterParam } from 'nuxt/server'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isFinite(id) || id < 1) {
    throw createApiError('VALIDATION_ERROR', 'Invalid category ID')
  }

  const session = await getUserSession(event)
  const scope = session.user ? 'admin' : 'public'

  const category = await useQueries(event).categoryArticles.findById(id, scope)

  if (!category) {
    throw createApiError('NOT_FOUND', 'Category not found')
  }

  return { data: category }
})
