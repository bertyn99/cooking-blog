<script lang="ts" setup>
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
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
