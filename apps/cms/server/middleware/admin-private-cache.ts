import { getRequestURL } from 'h3'

const ADMIN_HTML_CACHE = 'private, no-store, must-revalidate'

/**
 * Prevent Alchemy Workers Cache from storing authenticated admin HTML.
 * Public `/images/**` and `/api/**` are excluded.
 */
export default defineEventHandler((event) => {
  const path = getRequestURL(event).pathname
  if (path.startsWith('/api/') || path.startsWith('/images/')) {
    return
  }
  if (path.startsWith('/_nuxt/') || path.startsWith('/__')) {
    return
  }
  if (/\.[^/]+$/.test(path)) {
    return
  }
  setHeader(event, 'Cache-Control', ADMIN_HTML_CACHE)
})
