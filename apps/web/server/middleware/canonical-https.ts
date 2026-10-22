import { defineEventHandler, getRequestURL, sendRedirect } from 'nuxt/server'
/**
 * Canonical origin + path enforcement (prod only).
 *
 * Cloudflare Workers custom domains serve both `http://` and `https://` at the
 * edge, and nothing collapsed trailing slashes — four 200 variants of the same
 * URL diluted canonicals (Nuxt SEO Pro action `invalid-canonical` on
 * `/techniques-culinaires/methodes-de-cuisson`).
 *
 * - `http://<prod-host>/…`      → 301 `https://<prod-host>/…`
 * - `https://<prod-host>/x/`    → 301 `…/x` (`site.trailingSlash: false`)
 *
 * No-op without a `https://` `NUXT_PUBLIC_SITE_URL` (local dev, previews).
 * @see YGG-188
 */
export default defineEventHandler((event) => {
  const siteUrl = process.env.NUXT_PUBLIC_SITE_URL
  if (!siteUrl) return

  let site: URL
  try {
    site = new URL(siteUrl)
  } catch {
    return
  }
  if (site.protocol !== 'https:') return

  const url = getRequestURL(event, { xForwardedHost: true, xForwardedProto: true })
  if (url.hostname !== site.hostname) return

  if (url.protocol === 'http:') {
    return sendRedirect(event, `https://${site.host}${url.pathname}${url.search}`, 301)
  }

  if (url.pathname.length > 1 && url.pathname.endsWith('/')) {
    return sendRedirect(event, url.pathname.replace(/\/+$/, '') + url.search, 301)
  }
})
