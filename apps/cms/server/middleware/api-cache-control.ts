import { getRequestURL } from 'nitro/h3'

/**
 * Workers Cache (Alchemy `cache` on the CMS worker) must not store API JSON —
 * stale empty lists were served for `/api/categories` after import.
 */
export default defineEventHandler((event) => {
  const path = getRequestURL(event).pathname
  if (!path.startsWith('/api/')) {
    return
  }
  event.res.headers.set('Cache-Control', 'private, no-store, must-revalidate')
})
