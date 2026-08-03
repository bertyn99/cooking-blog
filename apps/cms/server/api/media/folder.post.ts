import { createMediaFolder } from '../../utils/media'
import { canEditContent } from '../../../shared/abilities'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  await authorize(event, canEditContent)

  const body = await readBody<{ name?: string, parentPrefix?: string }>(event)
  if (!body?.name?.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'name is required' })
  }

  const folder = await createMediaFolder(event, {
    name: body.name,
    parentPrefix: body.parentPrefix,
  })
  setResponseStatus(event, 201)
  return folder
})
