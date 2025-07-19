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

console.log('slug: ', `page-${slug.length == 1 ? slug: (slug as string[]).join('-')}`);

const { find } = useStrapi();
const {
  data: page,
  pending,
  refresh,
  error,
} = await useAsyncData<{
  data: Article | null;
}>(`page-${slug.length === 1 ? slug : (slug as string[]).join('-')}`, () =>
  find<Article>('pages', {
    filters: {
      slug: { $eq: slug.length === 1 ? slug : slug[1] },
      ...(slug.length > 1
        ? {
            parent: {
              slug: { $eq: slug[0] },
            },
          }
        : {}),
    },
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
    url: "https://journalducuistot.fr/" + [...slug].join("/"),
    author: "bertyn",
    datePublished: page.value?.publishedAt,
    dateModified: page.value?.updatedAt,
  }
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
