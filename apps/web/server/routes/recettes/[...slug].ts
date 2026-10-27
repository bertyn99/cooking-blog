import { defineEventHandler, getRequestURL, sendRedirect } from 'nuxt/server'

/**
 * Legacy plural recipe URLs → current flat recipe route.
 *
 * Old CMS exported two shapes:
 * - `/recettes/{slug}` (already flat)            → `/recette/{slug}`
 * - `/recettes/{category}/{slug}` (nested, dead) → `/recette/{slug}`
 *
 * A route-rules wildcard maps segments 1:1, so the nested shape 301'd into
 * `/recette/{category}/{slug}` — a route the site never served — and chained
 * into a 404 (GSC "Introuvable (404)" report). Flattening to the last
 * segment matches the current `/recette/{slug}` scheme. When the recipe no
 * longer exists, the target 404s directly — cleaner for Google than a
 * redirect chain.
 *
 * Lives in a handler (not routeRules) because the reshape cannot be
 * expressed as a static redirect map.
 * @see YGG-190, YGG-194
 */
export default defineEventHandler((event) => {
  const pathname = getRequestURL(event).pathname
  const slug = pathname
    .replace(/^\/recettes\/?/, '')
    .split('/')
    .filter(Boolean)
    .pop()

  // Client payload requests and asset-like paths: no redirect history to
  // preserve — let them 404 instead of inventing payload URLs.
  if (!slug || slug.startsWith('_') || slug.includes('.')) {
    return sendRedirect(event, '/recette', 301)
  }

  return sendRedirect(event, `/recette/${slug}`, 301)
})
