export default defineNuxtRouteMiddleware((to, from) => {
  const listRedirects = [
    { from: "/techniques-de-cuisine", to: "/bases-culinaires" },
  ];
  let redirectPath = listRedirects.filter((v) => v.from == to.path);

  if (redirectPath.length !== 0 && redirectPath[0].to) {
    return navigateTo(redirectPath[0].to, { redirectCode: 301 });
  }
});
