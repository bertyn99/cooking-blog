import { getRequestURL } from 'h3'

/**
 * Workers Cache (Alchemy `cache` on the CMS worker) must not store API JSON —
 * stale empty lists were served for `/api/categories` after import.
 */
export default defineEventHandler((event) => {
  const path = getRequestURL(event).pathname
  if (!path.startsWith('/api/')) {
    return
  }
  setHeader(event, 'Cache-Control', 'private, no-store, must-revalidate')
})
