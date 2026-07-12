<script lang="ts" setup>
definePageMeta({ layout: "content" });

import { useGenerateSchemaArianne } from "~/composables/useGenerateSchemaArianne";
import type { Article, Category, Cover } from "~/types/strapiMeta";
const {
  params: { category },
} = useRoute();
if (category.length === 0 || category === " ") {
  throw createError({ statusCode: 404, statusMessage: "Category Page Not Found" });
}


const { find } = useStrapi();
const {
  data: page,
  pending,
  refresh,
  error,
} = await useAsyncData<{
  data: Article[];
}>(`page-recettes-category-${category.length == 1 ? category[0]:category}`, () =>
  find(`pages`, {
    filters: {
      slug: { $eq: category.length !==0 ? `recettes-${category}`:`recettes-${category[0]}`},
     
      parent: {
        slug: { $eq: "recette" }, // Ensure the parent slug is 'recette'
      },
    },
    populate: ["content", "seoMeta", "parent"],
    pagination: {
      page: 0,
      pageSize: 1,
    },
  }),{
    transform: (data) => data.data[0]
  }
);

console.log(page.value);  
const ariane = useGenerateSchemaArianne(category);

if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: "Page Not Found" });
}

const displayPage = page.value?.content || [];
const titleContent = computed(
  () => page.value?.title || "No title"
);

const seo = computed(() => page.value?.seoMeta || {});
// set the meta
useSeoMeta(
  {
    title: titleContent.value || "Journal du cuistot",
    description: seo.value?.description || "No description",
    keywords: seo.value?.keywords || "No keyword",

    url: "https://journalducuistot.fr/recette/recettes-" + category,

    author: "bertyn",
    datePublished: page.value?.publishedAt,
    dateModified: page.value?.updatedAt,
  }
);
useHead({
  link: [
    {
      rel: "canonical",
      href: "https://journalducuistot.fr/recette/recettes-" + category,
    },
  ],
});
defineOgImageComponent('Cooking', {
  headline: titleContent.value || "Journal du cuistot",
  description: seo.value?.description || "No description",
});
</script>

<template>
  <SchemaOrgBreadcrumb :itemListElement="ariane" />
  <BaseContentDisplay :content="displayPage" />
</template>
