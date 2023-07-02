<script lang="ts" setup>
definePageMeta({ layout: "content" });

import { Article, Category, Cover } from "~/types/strapiMeta";
const {
  params: { slug },
} = useRoute();

if (slug.length === 0 || slug === " ") {
  throw createError({ statusCode: 404, statusMessage: "Page Not Found" });
}

const { find } = useStrapi();
const {
  data: page,
  pending,
  refresh,
  error,
} = await useAsyncData<{
  data: Article[];
}>(`page-${slug}`, () =>
  find(`pages`, {
    filters: { slug: { $eq: slug } },
    populate: ["Content", "seoMeta"],
    pagination: {
      page: 0,
      pageSize: 1,
    },
  })
);
console.log(page);
if (page.value?.data.length === 0) {
  throw createError({ statusCode: 404, statusMessage: "Page Not Found" });
}

const displayPage = page.value?.data[0].attributes?.Content || [];
const titleContent = computed(
  () => page.value?.data[0].attributes?.title || "No title"
);
</script>

<template>
  <BaseContentDisplay :content="displayPage" />
</template>
