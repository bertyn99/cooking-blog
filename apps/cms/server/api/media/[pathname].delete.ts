import { deleteMedia } from '../../utils/media'

export default defineEventHandler(async (event) => {
  const pathname = getRouterParam(event, 'pathname')
  if (!pathname) throw createError({ statusCode: 404 })

  await deleteMedia(pathname)
  return sendNoContent(event)
})
