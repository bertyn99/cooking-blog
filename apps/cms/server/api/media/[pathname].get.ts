import { blob } from 'hub:blob'

export default defineEventHandler(async (event) => {
  const pathname = getRouterParam(event, 'pathname')
  if (!pathname) throw createError({ statusCode: 404 })

  try {
    const meta = await blob.head(pathname)
    return meta
  }
  catch {
    throw createError({ statusCode: 404, statusMessage: 'Media not found' })
  }
})
