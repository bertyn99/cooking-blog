/**
 * Browser CORS for public reads.
 *
 * The web app's client-side navigation (SPA `useAsyncData`) fetches `/api/**`
 * straight from the browser. Without `Access-Control-Allow-Origin` every
 * client-side navigation fails (the page guards then throw 404), while direct
 * loads keep working because SSR fetches server-side — the "404 until refresh"
 * production symptom.
 *
 * Scope kept minimal: GET/HEAD/OPTIONS under `/api/**`, never `/api/admin` or
 * `/api/auth`. Origins are allow-listed: prod site, localhost dev, plus the
 * `CMS_CORS_ORIGINS` env override (comma-separated) for preview deployments.
 */
const EXTRA_ORIGINS = (process.env.CMS_CORS_ORIGINS ?? '')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean)

const STATIC_ORIGINS = new Set([
  'https://journalducuistot.fr',
  'https://www.journalducuistot.fr',
  ...EXTRA_ORIGINS,
])

function isAllowedOrigin(origin: string): boolean {
  if (STATIC_ORIGINS.has(origin)) {
    return true
  }
  try {
    const { hostname } = new URL(origin)
    return hostname === 'localhost' || hostname === '127.0.0.1'
  } catch {
    return false
  }
}

export default defineEventHandler((event) => {
  const path = getRequestURL(event).pathname
  if (!path.startsWith('/api/')) {
    return
  }

  const origin = getRequestHeader(event, 'origin')
  if (!origin || !isAllowedOrigin(origin)) {
    return
  }

  if (getMethod(event) === 'OPTIONS') {
    setHeader(event, 'Access-Control-Allow-Origin', origin)
    setHeader(event, 'Vary', 'Origin')
    setHeader(event, 'Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS')
    setHeader(event, 'Access-Control-Max-Age', 86400)
    setResponseStatus(event, 204)
    return ''
  }

  if (getMethod(event) !== 'GET' && getMethod(event) !== 'HEAD') {
    return
  }
  // Admin/auth stay same-origin only — never expose them cross-origin.
  if (path.startsWith('/api/admin') || path.startsWith('/api/auth')) {
    return
  }

  setHeader(event, 'Access-Control-Allow-Origin', origin)
  setHeader(event, 'Vary', 'Origin')
})
