import { deleteMedia } from '../../utils/media'
import { useDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const pathname = getRouterParam(event, 'pathname')
  if (!pathname) {
    throw createError({ statusCode: 404 })
  }

  await deleteMedia(event, pathname, useDb(event))
  return sendNoContent(event)
})
