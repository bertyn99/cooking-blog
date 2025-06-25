<script lang="ts" setup>
definePageMeta({ layout: "content" });

import { useGenerateSchemaArianne } from "~/composables/useGenerateSchemaArianne";
import type { Article, Category, Cover } from "~/types/strapiMeta";
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
}>(`page-${slug.length == 1 ? slug : slug[1]}`, () =>
  find(`pages`, {
    filters: {
      slug: { $eq: slug.length == 1 ? slug : slug[1] },
      ...(slug.length > 1
        ? {
            parent: {
              slug: { $eq: slug[0] }, // Ensure the parent slug is 'recette'
            },
          }
        : {}),
    },
    populate: {
      Content: true,
      seoMeta: true,
      page: true,
     /*  parent: {
        fields: ['slug'] // Only get the slug field from parent
      } */
    },
    pagination: {
      page: 0,
      pageSize: 1,
    },
  })
);

const ariane = useGenerateSchemaArianne(slug);

if (page.value?.data.length === 0) {
  throw createError({ statusCode: 404, statusMessage: "Page Not Found" });
}
console.log(page.value);

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

    url: "https://journalducuistot.fr/" + [...slug].join("/"),
    author: "bertyn",
    datePublished: page.value?.data[0].attributes?.publishedAt,
    dateModified: page.value?.data[0].attributes?.updatedAt,
  }) as any
);
useHead({
  link: [
    {
      rel: "canonical",
      href: "https://journalducuistot.fr/" + [...slug].join("/"),
    },
  ],
});


defineOgImageComponent('Cooking', {
  headline: titleContent.value,
  description: seo.value?.description ,
})
</script> 

<template>
  <SchemaOrgBreadcrumb :itemListElement="ariane" />
  <BaseContentDisplay :content="displayPage" />
</template>
