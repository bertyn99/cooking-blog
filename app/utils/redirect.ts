const listRedirects: {
  [path: string]: any;
} = {
  /*   "/techniques-de-cuisine": {
      redirect: { to: "/bases-culinaires", statusCode: 301 },
    }, */
  "/techniques-de-cuisine/**": {
    redirect: { to: "/techniques-culinaires/**", statusCode: 301 },
  },
  "/techniques-de-culinaires/techniques-de-cuisson": {
    redirect: { to: "/techniques-culinaires/methodes-de-cuisson", statusCode: 301 },
  },

  "/recipe/tout-sur-le-the-indien": {
    redirect: { to: "/blog/tout-sur-le-the-indien", statusCode: 301 },
  },
  "/articles/tout-sur-le-the-indien": {
    redirect: { to: "/blog/tout-sur-le-the-indien", statusCode: 301 },
  },
  "/articles/le-roi-du-riz-tout-ceque-vous-devez-savoir-sur-le-riz-basmati": {
    redirect: {
      to: "/blog/le-roi-du-riz-tout-ceque-vous-devez-savoir-sur-le-riz-basmati",
      statusCode: 301,
    },
  },
  "/articles/les-legumes-de-base-de-la-cuisine-asiatique": {
    redirect: {
      to: "/blog/les-legumes-de-base-de-la-cuisine-asiatique",
      statusCode: 301,
    },
  },
  "/recette/les-legumes-de-base-de-la-cuisine-asiatique": {
    redirect: {
      to: "/blog/les-legumes-de-base-de-la-cuisine-asiatique",
      statusCode: 301,
    },
  },
  "/recette/les-sauces-indispensables-pour-la-cuisine-asiatique": {
    redirect: {
      to: "/blog/les-sauces-indispensables-pour-la-cuisine-asiatique",
      statusCode: 301,
    },
  },

  "/recette/le-roi-du-riz-tout-ceque-vous-devez-savoir-sur-le-riz-basmati": {
    redirect: {
      to: "/blog/le-roi-du-riz-tout-ceque-vous-devez-savoir-sur-le-riz-basmati",
      statusCode: 301,
    },
  },
};
export default listRedirects;
