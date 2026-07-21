import { deleteMediaFolder } from '../../utils/media'
import { canEditContent } from '../../../shared/abilities'
import { useDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  await authorize(event, canEditContent)

  const body = await readBody<{ prefix?: string }>(event)
  if (!body?.prefix) {
    throw createError({ statusCode: 400, statusMessage: 'prefix is required' })
  }

  await deleteMediaFolder(event, useDb(event), body.prefix)
  return sendNoContent(event)
})
