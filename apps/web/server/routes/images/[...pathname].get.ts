import { serveOptimizedCmsImage } from '../../utils/serve-cms-image'

export default defineEventHandler(async (event) => {
  const pathname = getRouterParam(event, 'pathname')
  if (!pathname) {
    throw createError({ statusCode: 404 })
  }

  return serveOptimizedCmsImage(event, pathname)
})
