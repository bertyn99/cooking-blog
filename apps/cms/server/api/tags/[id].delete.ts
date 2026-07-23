import { useQueries } from '../../utils/db'
import { requireEditor } from '../../utils/http-auth'
import { createApiError } from '../../utils/errors'

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

  await tags.softDelete(id)
  return { data: { id, deleted: true } }
})
