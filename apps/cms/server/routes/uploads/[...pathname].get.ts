import { serveCmsImage } from '../../utils/serve-image'

export default defineEventHandler(async (event) => {
  const pathname = getRouterParam(event, 'pathname')
  if (!pathname) {
    throw createError({ statusCode: 404 })
  }

  // Storage root is `uploads/` — `/uploads/<file>` maps to the `uploads/<file>`
  // storage key. Serves any media type (image, video, pdf…) without transforms;
  // transformed images keep using `/images/{modifiers}/…`.
  return serveCmsImage(event, `uploads/${pathname.replace(/^\/+/, '')}`)
})
