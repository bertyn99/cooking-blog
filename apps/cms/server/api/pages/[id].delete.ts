import { createApiError } from '../../utils/errors'
import { canEditContent } from '../../../shared/abilities'
import { useQueries } from '../../utils/db'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  await authorize(event, canEditContent)

  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isFinite(id) || id < 1) {
    throw createApiError('VALIDATION_ERROR', 'Invalid page ID')
  }

  const { pages } = useQueries(event)
  const existing = await pages.findRowById(id)

  if (!existing) {
    throw createApiError('NOT_FOUND', 'Page not found')
  }

  if (existing.deletedAt !== null) {
    throw createApiError('VALIDATION_ERROR', 'Page is already deleted')
  }

  const deletedAt = await pages.softDelete(id)

  return { data: { id, deletedAt } }
})
