import { serveCmsMediaFile } from '../../utils/serve-cms-image'

export default defineEventHandler(async (event) => {
  const pathname = getRouterParam(event, 'pathname')
  if (!pathname) {
    throw createError({ statusCode: 404 })
  }

  // Raw media passthrough (image, video, pdf…) — the CMS enforces the
  // `uploads/` storage policy, rate limiting and caching.
  return serveCmsMediaFile(event, pathname)
})
