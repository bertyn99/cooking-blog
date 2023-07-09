export default defineNuxtRouteMiddleware((to, from) => {
  const listRedirects = [
    { from: "/techniques-de-cuisine", to: "/bases-culinaires" },
    {
      from: "/recipe/tout-sur-le-the-indien",
      to: "/blog/tout-sur-le-the-indien",
    },
    {
      from: "/articles/tout-sur-le-the-indien",
      to: "/blog/tout-sur-le-the-indien",
    },
    {
      from: "/articles/le-roi-du-riz-tout-ceque-vous-devez-savoir-sur-le-riz-basmati",
      to: "/blog/le-roi-du-riz-tout-ceque-vous-devez-savoir-sur-le-riz-basmati",
    },
    {
      from: "/articles/les-legumes-de-base-de-la-cuisine-asiatique",
      to: "/blog/les-legumes-de-base-de-la-cuisine-asiatique",
    },
    {
      from: "/recette/les-sauces-indispensables-pour-la-cuisine-asiatique",
      to: "/blog/les-sauces-indispensables-pour-la-cuisine-asiatique",
    },

    {
      from: "/recette/le-roi-du-riz-tout-ceque-vous-devez-savoir-sur-le-riz-basmati",
      to: "/blog/le-roi-du-riz-tout-ceque-vous-devez-savoir-sur-le-riz-basmati",
    },
  ];
  //
  https: let redirectPath = listRedirects.filter((v) => v.from == to.path);

  if (redirectPath.length !== 0 && redirectPath[0].to) {
    return navigateTo(redirectPath[0].to, { redirectCode: 301 });
  }
});
