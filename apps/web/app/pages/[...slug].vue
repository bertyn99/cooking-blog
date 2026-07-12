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

// Ensure slug is always an array for consistent handling
const slugArray = Array.isArray(slug) ? slug : [slug];
const currentSlug = slugArray[slugArray.length - 1];
const parentSlug = slugArray.length > 1 ? slugArray[slugArray.length - 2] : null;

console.log('slug: ', slugArray.join('-'));

const { find } = useStrapi();

// Create a unique key for caching
const cacheKey = `page-${slugArray.join('-')}`;
const filters: any = {
    slug: { $eq: currentSlug },
  };

  // Add parent filter if we have a parent slug
  if (parentSlug) {
    filters.parent = {
      slug: { $eq: parentSlug },
    };
  }
const {
  data: page,
  pending,
  refresh,
  error,
} = await useAsyncData<Article | null>(cacheKey, async () =>  find<Article>('pages', {
    filters,
    pagination: {
      page: 0,
      pageSize: 1,
    },
    populate: {
      content: true,
      seoMeta: true,
      parent: {
        fields: ['slug'],
      },
    },
  }), {
    transform: (data) => data.data?.[0] || null
  }
);
console.log('page: ', page.value);

const ariane = useGenerateSchemaArianne(slug);

if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: "Page Not Found" });
}

const displayPage = page.value?.content || [];
const titleContent = computed(
  () => page.value?.title || "No title"
);

const seo = computed(() => page.value?.seoMeta || {});
// set the meta
useSeoMeta({
    title: titleContent.value || "Journal du cuistot",
    description: seo.value?.description || "No description",
    keywords: seo.value?.keywords || "No keyword",
    url: "https://journalducuistot.fr/" + slugArray.join("/"),
    author: "bertyn",
    datePublished: page.value?.publishedAt,
    dateModified: page.value?.updatedAt,
  }
);
useHead({
  link: [
    {
      rel: "canonical",
      href: "https://journalducuistot.fr/" + slugArray.join("/"),
    },
  ],
});


defineOgImageComponent('Cooking', {
  headline: titleContent.value,
  description: seo.value?.description,
})
</script> 

<template>
  <SchemaOrgBreadcrumb :itemListElement="ariane" />
  <BaseContentDisplay :content="displayPage" />
</template>
