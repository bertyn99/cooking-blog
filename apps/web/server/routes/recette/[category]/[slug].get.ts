import { defineEventHandler, getRequestURL, sendRedirect } from 'nuxt/server'

/**
 * Legacy nested recipe URLs → current flat recipe route.
 *
 * `/recette/{category}/{slug}` was never a served route (recipes are flat at
 * `/recette/{slug}`, and category pages live at `/recette/recettes-{cat}` —
 * one segment). GSC still crawls the nested shape from old internal links,
 * so flatten to the last segment and let the target answer: 200 when the
 * recipe exists, 404 otherwise — cleaner for Google than a redirect chain.
 *
 * Lives in a handler (not routeRules) because the reshape cannot be
 * expressed as a static redirect map. @see YGG-81
 */
export default defineEventHandler((event) => {
  const pathname = getRequestURL(event).pathname
  const slug = pathname
    .replace(/^\/recette\/?/, '')
    .split('/')
    .filter(Boolean)
    .pop()

  if (!slug) {
    return sendRedirect(event, '/recette', 301)
  }

  return sendRedirect(event, `/recette/${slug}`, 301)
})
