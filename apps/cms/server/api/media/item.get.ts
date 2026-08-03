import { getMediaDetail } from '../../utils/media'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const pathname = query.pathname as string | undefined
  if (!pathname) {
    throw createError({ statusCode: 400, statusMessage: 'pathname is required' })
  }
  return getMediaDetail(event, pathname)
})
