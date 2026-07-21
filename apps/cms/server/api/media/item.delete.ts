import { deleteMediaBlob } from '../../utils/media'
import { canEditContent } from '../../../shared/abilities'
import { useDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  await authorize(event, canEditContent)

  const body = await readBody<{ pathname?: string }>(event)
  if (!body?.pathname) {
    throw createError({ statusCode: 400, statusMessage: 'pathname is required' })
  }

  await deleteMediaBlob(event, body.pathname, useDb(event))
  return sendNoContent(event)
})
