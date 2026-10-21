import { serveOptimizedCmsImage } from '../../utils/serve-cms-image'
import { createError, defineEventHandler, getRouterParam } from 'h3'

export default defineEventHandler(async (event) => {
  const pathname = getRouterParam(event, 'pathname')
  if (!pathname) {
    throw createError({ statusCode: 404 })
  }

  return serveOptimizedCmsImage(event, pathname)
})
