/**
 * Legacy nested recipe URLs — /recette/{cat}/{slug} from old internal links.
 *
 * When the LAST segment matches a published recipe, flatten (301) to its
 * canonical /recette/{slug}. 3+ segments only, and /recette must be the
 * first segment — so nested CMS pages (silo hub → sub-page) render
 * normally and canonical 1-segment recipe URLs never loop.
 *
 * Named middleware (not inline in definePageMeta): inline functions are
 * extracted without a Nuxt instance on SSR (NUXT_E1001 → 500).
 * @see YGG-194, YGG-81
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const slug = Array.isArray(to.params.slug) ? to.params.slug : [to.params.slug];
  const parts = slug.filter(Boolean).map(String);
  if (parts.length < 3 || parts[0] !== "recette") return;

  const recipeSlug = parts[parts.length - 1] ?? "";
  if (!recipeSlug) return;

  const cms = useCms();
  const hit = await cms.recipes({ slug: recipeSlug, page: 1, pageSize: 1 });
  if ((hit.data?.length ?? 0) > 0) {
    return navigateTo(`/recette/${recipeSlug}`, { redirectCode: 301 });
  }
});
