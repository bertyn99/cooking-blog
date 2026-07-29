import { useQueries } from '../../utils/db'
import { requireEditor } from '../../utils/http-auth'
import { createApiError } from '../../utils/errors'

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

  await navigation.deleteById(id)
  return { data: { id, deleted: true } }
})
