import { validateBody } from '../../utils/validate'
import { createApiError } from '../../utils/errors'
import { requireWriteActor } from '../../utils/write-auth'
import {
  updatePageMutation,
  updatePageSchema,
} from '../../services/page-mutations'

export default defineEventHandler(async (event) => {
  const actor = await requireWriteActor(event, 'pages')

  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isFinite(id) || id < 1) {
    throw createApiError('VALIDATION_ERROR', 'Invalid page ID')
  }

  const body = validateBody(updatePageSchema, await readBody(event))
  const updated = await updatePageMutation(event, actor, id, body)
  return { data: updated }
})
