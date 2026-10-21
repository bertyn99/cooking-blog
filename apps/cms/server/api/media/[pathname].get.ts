import { useMediaStorage } from '../../utils/media-storage'
import { createError, defineEventHandler, getRouterParam } from 'nuxt/server'

export default defineEventHandler(async (event) => {
  const pathname = getRouterParam(event, 'pathname')
  if (!pathname) {
    throw createError({ statusCode: 404 })
  }

  const meta = await useMediaStorage(event).head(pathname)
  if (!meta) {
    throw createError({ statusCode: 404, statusMessage: 'Media not found' })
  }

  return meta
})
