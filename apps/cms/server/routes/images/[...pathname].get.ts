import { useMediaStorage } from '../../utils/media-storage'

export default defineEventHandler(async (event) => {
  const pathname = getRouterParam(event, 'pathname')
  if (!pathname) {
    throw createError({ statusCode: 404 })
  }

  const storage = useMediaStorage(event)
  const result = await storage.get(pathname)
  if (!result) {
    throw createError({ statusCode: 404, statusMessage: 'Media not found' })
  }

  setHeader(event, 'Content-Security-Policy', 'default-src \'none\';')
  setHeader(event, 'Content-Type', result.object.contentType)
  if (result.object.etag) {
    setHeader(event, 'ETag', result.object.etag)
  }

  return result.body
})
