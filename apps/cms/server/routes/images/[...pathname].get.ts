import { serveCmsImage } from '../../utils/serve-image'
import { createError, defineEventHandler, getRouterParam } from 'nuxt/server'

export default defineEventHandler(async (event) => {
  const pathname = getRouterParam(event, 'pathname')
  if (!pathname) {
    throw createError({ statusCode: 404 })
  }

  return serveCmsImage(event, pathname)
})
