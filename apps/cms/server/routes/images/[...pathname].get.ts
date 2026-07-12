import { blob } from 'hub:blob'

export default defineEventHandler(async (event) => {
  const pathname = getRouterParam(event, 'pathname')
  if (!pathname) throw createError({ statusCode: 404 })

  setHeader(event, 'Content-Security-Policy', "default-src 'none';")
  return blob.serve(event, pathname)
})
