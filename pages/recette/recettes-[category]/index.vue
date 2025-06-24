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
    populate: ["Content", "seoMeta", "page"],
    pagination: {
      page: 0,
      pageSize: 1,
    },
  })
);

const ariane = useGenerateSchemaArianne(category);

if (page.value?.data.length === 0) {
  throw createError({ statusCode: 404, statusMessage: "Paged Not Found" });
}

const displayPage = page.value?.data[0].attributes?.Content || [];
const titleContent = computed(
  () => page.value?.data[0].attributes?.title || "No title"
);

const seo = computed(() => page.value?.data[0].attributes?.seoMeta || {});
// set the meta
useSeoMeta(
  useLoadMeta({
    title: titleContent.value || "Journal du cuistot",
    description: seo.value?.description || "No description",
    keywords: seo.value?.keywords || "No keyword",

    url: "https://www.journalducuistot.fr/recette/" + [...category].join("/"),
    author: "bertyn",
    datePublished: page.value?.data[0].attributes?.publishedAt,
    dateModified: page.value?.data[0].attributes?.updatedAt,
  }) as any
);
useHead({
  link: [
    {
      rel: "canonical",
      href: "https://www.journalducuistot.fr/" + [...category].join("/"),
    },
  ],
});
</script>

<template>
  <SchemaOrgBreadcrumb :itemListElement="ariane" />
  <BaseContentDisplay :content="displayPage" />
</template>
