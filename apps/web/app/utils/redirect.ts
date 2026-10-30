import type { NitroRouteConfig } from 'nitropack/types'

/** CMS page slugs that 301 elsewhere — omit from sitemap to avoid duplicate signals. */
export const SITEMAP_EXCLUDED_PAGE_PATHS = new Set([
  '/les-epices-essentielles-en-cuisine-1',
  // legal pages are intentionally noindex — keep them out of the sitemap
  '/politique-de-confidentialite',
  '/mentions-legales',
])

const listRedirects: Record<string, NitroRouteConfig> = {
  '/sitemap-pages.xml': {
    redirect: { to: '/__sitemap__/pages.xml', statusCode: 301 },
  },
  '/sitemap-blog.xml': {
    redirect: { to: '/__sitemap__/blog.xml', statusCode: 301 },
  },
  '/sitemap-recipes.xml': {
    redirect: { to: '/__sitemap__/recipes.xml', statusCode: 301 },
  },

  // Legacy absolute paths still present in imported markdown.
  '/articles/**': {
    redirect: { to: '/blog/**', statusCode: 301 },
  },

  // Old plural recipe route still linked from imported article content.
  // Route-rules wildcard maps segments 1:1, which breaks the legacy nested
  // scheme (/recettes/{cat}/{slug} → /recette/{cat}/{slug} → 404: no nested
  // recipe route exists). The deeper paths are handled by
  // server/routes/recettes/[...slug].ts, which flattens to the recipe slug;
  // the bare listing path has no slug to flatten. @see YGG-190, YGG-194
  '/recettes': {
    redirect: { to: '/recette', statusCode: 301 },
  },

  // Pre-migration recipe URL → blog article replacement. @see YGG-189
  '/recette/les-ustensiles-de-cuisine-indispensables-pour-les-cuisiniers-debutants': {
    redirect: {
      to: '/blog/materiels-ustensils/les-10-ustensiles-de-cuisine-indispensables',
      statusCode: 301,
    },
  },

  // Root slugs of nested CMS pages — equity from the pre-YGG-79 flat tree.
  // Canonical paths are the parented hierarchy served by /[...slug].vue.
  // @see YGG-81
  '/methodes-de-cuisson': {
    redirect: { to: '/techniques-culinaires/methodes-de-cuisson', statusCode: 301 },
  },
  '/technique-cuisson-etouffee': {
    redirect: { to: '/techniques-culinaires/methodes-de-cuisson/technique-cuisson-etouffee', statusCode: 301 },
  },
  '/guide-braisage-plats-mijotes': {
    redirect: { to: '/techniques-culinaires/methodes-de-cuisson/guide-braisage-plats-mijotes', statusCode: 301 },
  },
  '/art-de-rotir-guide-complet': {
    redirect: { to: '/techniques-culinaires/methodes-de-cuisson/art-de-rotir-guide-complet', statusCode: 301 },
  },
  '/guide-cuisson-pochee': {
    redirect: { to: '/techniques-culinaires/methodes-de-cuisson/guide-cuisson-pochee', statusCode: 301 },
  },
  '/guide-friture-maison': {
    redirect: { to: '/techniques-culinaires/methodes-de-cuisson/guide-friture-maison', statusCode: 301 },
  },
  '/cuisson-vapeur-facile': {
    redirect: { to: '/techniques-culinaires/methodes-de-cuisson/cuisson-vapeur-facile', statusCode: 301 },
  },
  '/secrets-grillade-parfaite': {
    redirect: { to: '/techniques-culinaires/methodes-de-cuisson/secrets-grillade-parfaite', statusCode: 301 },
  },
  '/saisir-viande-parfaitement': {
    redirect: { to: '/techniques-culinaires/methodes-de-cuisson/saisir-viande-parfaitement', statusCode: 301 },
  },
  '/techniques-de-decoupes': {
    redirect: { to: '/techniques-culinaires/techniques-de-decoupes', statusCode: 301 },
  },
  '/conservation-aliments': {
    redirect: { to: '/techniques-culinaires/conservation-aliments', statusCode: 301 },
  },
  '/preparation-des-ingredients': {
    redirect: { to: '/techniques-culinaires/preparation-des-ingredients', statusCode: 301 },
  },
  '/les-epices-essentielles-en-cuisine': {
    redirect: { to: '/techniques-culinaires/les-epices-essentielles-en-cuisine', statusCode: 301 },
  },
  '/recettes-du-monde': {
    redirect: { to: '/recette/recettes-du-monde', statusCode: 301 },
  },

  // Root-level URLs still linked from imported article content. @see YGG-190
  '/epices-indiennes-decouvrez-la-magie-des-saveurs-de-l-inde': {
    redirect: {
      to: '/blog/astuces-de-cuisine/comment-utiliser-les-epices-et-les-herbes-aromatiques',
      statusCode: 301,
    },
  },
  '/les-sauces-indispensables-pour-la-cuisine-asiatique': {
    redirect: {
      to: '/blog/gastronomie-culture/les-sauces-indispensables-pour-la-cuisine-asiatique',
      statusCode: 301,
    },
  },

  // Uncategorized category duplicate of the gastronomie-culture article.
  // @see YGG-81 (canonicalize duplicate page URLs)
  '/blog/uncategorized/les-sauces-indispensables-pour-la-cuisine-asiatique': {
    redirect: {
      to: '/blog/gastronomie-culture/les-sauces-indispensables-pour-la-cuisine-asiatique',
      statusCode: 301,
    },
  },

  '/techniques-de-cuisine/**': {
    redirect: { to: '/techniques-culinaires/**', statusCode: 301 },
  },
  '/techniques-de-culinaires/techniques-de-cuisson': {
    redirect: { to: '/techniques-culinaires/methodes-de-cuisson', statusCode: 301 },
  },
  '/bases-culinaires/techniques-de-cuisson': {
    redirect: { to: '/techniques-culinaires/methodes-de-cuisson', statusCode: 301 },
  },
  '/bases-culinaires/**': {
    redirect: { to: '/techniques-culinaires/**', statusCode: 301 },
  },

  '/les-epices-essentielles-en-cuisine-1': {
    redirect: {
      to: '/techniques-culinaires/les-epices-essentielles-en-cuisine',
      statusCode: 301,
    },
  },

  '/blog/astuces-de-cuisine/epices-indiennes-decouvrez-la-magie-des-saveurs-de-l-inde': {
    redirect: {
      to: '/blog/astuces-de-cuisine/comment-utiliser-les-epices-et-les-herbes-aromatiques',
      statusCode: 301,
    },
  },
  '/blog/cuisine-sante/les-legumes-de-base-de-la-cuisine-asiatique': {
    redirect: {
      to: '/blog/inspiration-culinaire/10-plats-de-street-food-asiatique-incontournables-a-faire-chez-soi',
      statusCode: 301,
    },
  },
  '/blog/guides-gourmands/les-meilleurs-restaurants-de-plats-de-street-food-asiatique-a-paris': {
    redirect: {
      to: '/blog/guides-gourmands/ou-trouver-les-meilleures-brochettes-de-poulet-yakitori-a-paris',
      statusCode: 301,
    },
  },

  '/recipe/tout-sur-le-the-indien': {
    redirect: {
      to: '/blog/astuces-de-cuisine/comment-utiliser-les-epices-et-les-herbes-aromatiques',
      statusCode: 301,
    },
  },
  '/articles/tout-sur-le-the-indien': {
    redirect: {
      to: '/blog/astuces-de-cuisine/comment-utiliser-les-epices-et-les-herbes-aromatiques',
      statusCode: 301,
    },
  },
  '/articles/le-roi-du-riz-tout-ceque-vous-devez-savoir-sur-le-riz-basmati': {
    redirect: {
      to: '/blog/cuisine-sante/tout-savoir-sur-le-clou-de-girofle',
      statusCode: 301,
    },
  },
  '/articles/les-legumes-de-base-de-la-cuisine-asiatique': {
    redirect: {
      to: '/blog/inspiration-culinaire/10-plats-de-street-food-asiatique-incontournables-a-faire-chez-soi',
      statusCode: 301,
    },
  },
  '/recette/les-legumes-de-base-de-la-cuisine-asiatique': {
    redirect: {
      to: '/blog/inspiration-culinaire/10-plats-de-street-food-asiatique-incontournables-a-faire-chez-soi',
      statusCode: 301,
    },
  },
  '/recette/les-sauces-indispensables-pour-la-cuisine-asiatique': {
    redirect: {
      to: '/blog/gastronomie-culture/ingredient-secret-de-la-cuisine-de-rue-asiatique-populaire-le-nuoc-mam',
      statusCode: 301,
    },
  },
  '/recette/le-roi-du-riz-tout-ceque-vous-devez-savoir-sur-le-riz-basmati': {
    redirect: {
      to: '/blog/cuisine-sante/tout-savoir-sur-le-clou-de-girofle',
      statusCode: 301,
    },
  },

  '/blog/tout-sur-le-the-indien': {
    redirect: {
      to: '/blog/astuces-de-cuisine/comment-utiliser-les-epices-et-les-herbes-aromatiques',
      statusCode: 301,
    },
  },
  '/blog/le-roi-du-riz-tout-ceque-vous-devez-savoir-sur-le-riz-basmati': {
    redirect: {
      to: '/blog/cuisine-sante/tout-savoir-sur-le-clou-de-girofle',
      statusCode: 301,
    },
  },
  '/blog/les-legumes-de-base-de-la-cuisine-asiatique': {
    redirect: {
      to: '/blog/inspiration-culinaire/10-plats-de-street-food-asiatique-incontournables-a-faire-chez-soi',
      statusCode: 301,
    },
  },
  '/blog/les-sauces-indispensables-pour-la-cuisine-asiatique': {
    redirect: {
      to: '/blog/gastronomie-culture/ingredient-secret-de-la-cuisine-de-rue-asiatique-populaire-le-nuoc-mam',
      statusCode: 301,
    },
  },
}
export default listRedirects
