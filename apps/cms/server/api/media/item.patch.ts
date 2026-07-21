import { renameMediaFile } from '../../utils/media'
import { canEditContent } from '../../../shared/abilities'
import { useDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  await authorize(event, canEditContent)

  const body = await readBody<{ pathname?: string, originalName?: string }>(event)
  if (!body?.pathname || !body.originalName) {
    throw createError({ statusCode: 400, statusMessage: 'pathname and originalName are required' })
  }

  return renameMediaFile(event, useDb(event), body.pathname, body.originalName)
})
