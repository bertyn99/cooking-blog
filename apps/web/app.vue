<script lang="ts" setup>
const site = useSiteConfig();

useHead({
  meta: [
    {
      "http-equiv": "content-language",
      content: "fr-fr",
    },
  ],
});
useSchemaOrg([
  // @todo Select Identity: https://vue-schema-org.netlify.app/guide/guides/identity
  defineWebSite({
    "@id": `${site.url}/`,
    name: site.name,
  }),
  defineBreadcrumb({}),
  defineOrganization({
    "@id": `${site.url}/#organization`,
    name: site.name,
    url: `${site.url}/`,
    logo: `${site.url}/img/logo.webp`,
    /*    sameAs: [
      "https://www.facebook.com/sciredev",
      "https://twitter.com/sciredev",
      "https://www.instagram.com/sciredev/",
      "https://www.linkedin.com/company/sciredev/",
    ], */
  }),
]);

defineOgImage('Cooking', {
  headline: "Journal du cuistot",
  description: "Le journal du cuistot est un blog de cuisine qui propose des recettes, des astuces et des conseils pour les passionnés de cuisine.",
});
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
