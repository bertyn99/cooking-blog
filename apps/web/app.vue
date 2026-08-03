<script lang="ts" setup>
useHead({
  meta: [
    {
      "http-equiv": "content-language",
      content: "fr-fr",
    },
  ],
});

defineOgImage("Cooking", {
  headline: "Journal du cuistot",
  description:
    "Le journal du cuistot est un blog de cuisine qui propose des recettes, des astuces et des conseils pour les passionnés de cuisine.",
});
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
