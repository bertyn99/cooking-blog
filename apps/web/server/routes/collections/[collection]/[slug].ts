/**
 * Legacy collection URLs → recipe detail.
 * `/collections/recettes-marocaines/batbout-farci` → `/recette/batbout-farci`
 */
export default defineEventHandler((event) => {
  const slug = getRouterParam(event, "slug");
  if (!slug?.trim()) {
    throw createError({ statusCode: 404, statusMessage: "Not Found" });
  }
  return sendRedirect(event, `/recette/${encodeURIComponent(slug.trim())}`, 301);
});
