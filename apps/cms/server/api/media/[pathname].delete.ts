import { deleteMediaBlob } from '../../utils/media'
import { canEditContent } from '../../../shared/abilities'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  await authorize(event, canEditContent)

  const pathname = getRouterParam(event, 'pathname')
  if (!pathname) {
    throw createError({ statusCode: 404 })
  }

  await deleteMediaBlob(event, pathname)
  return sendNoContent(event)
})
