<script lang="ts" setup>
useSchemaOrg([
  // @todo Select Identity: https://vue-schema-org.netlify.app/guide/guides/identity
  defineWebSite({
    "@id": "https://journalducuistot.fr/",
    name: "ScireDev",
  }),
  defineBreadcrumb({}),
  defineOrganization({
    "@id": "https://journalducuistot.fr/#organization",
    name: "ScireDev",
    url: "https://journalducuistot.fr/",
    logo: "https://journalducuistot/img/scire_logo_primary.png",
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
