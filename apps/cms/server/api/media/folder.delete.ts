import { deleteMediaFolder } from '../../utils/media'
import { canEditContent } from '../../../shared/abilities'
import { createError, defineEventHandler, readBody } from 'nuxt/server'
import { sendNoContent } from 'h3'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  await authorize(event, canEditContent)

  const body = await readBody<{ prefix?: string }>(event)
  if (!body?.prefix) {
    throw createError({ statusCode: 400, statusMessage: 'prefix is required' })
  }

  await deleteMediaFolder(event, body.prefix)
  return sendNoContent(event)
})
