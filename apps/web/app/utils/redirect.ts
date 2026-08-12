import type { NitroRouteConfig } from 'nitropack';

/** CMS page slugs that 301 elsewhere — omit from sitemap to avoid duplicate signals. */
export const SITEMAP_EXCLUDED_PAGE_PATHS = new Set([
  '/les-epices-essentielles-en-cuisine-1',
]);

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
};
export default listRedirects;
