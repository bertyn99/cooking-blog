<script lang="ts" setup>
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
    "@id": "https://journalducuistot.fr/",
    name: "journalducuistot",
  }),
  defineBreadcrumb({}),
  defineOrganization({
    "@id": "https://journalducuistot.fr/#organization",
    name: "Journal du cuistot",
    url: "https://journalducuistot.fr/",
    logo: "https://journalducuistot/img/logo.webp",
    /*    sameAs: [
      "https://www.facebook.com/sciredev",
      "https://twitter.com/sciredev",
      "https://www.instagram.com/sciredev/",
      "https://www.linkedin.com/company/sciredev/",
    ], */
  }),
]);

defineOgImageComponent('Cooking', {
  headline: "Journal du cuistot",
  description: "Le journal du cuistot est un blog de cuisine qui propose des recettes, des astuces et des conseils pour les passionnés de cuisine.",
});
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
