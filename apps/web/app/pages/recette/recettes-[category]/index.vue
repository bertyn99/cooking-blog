<script lang="ts">
definePageMeta({ layout: "content" });
</script>

<script lang="ts" setup>
import { useGenerateSchemaArianne } from "~/composables/useGenerateSchemaArianne";
import type { Page } from "~/types/strapiMeta";

const {
  params: { category },
} = useRoute();

const categorySlug = Array.isArray(category) ? category[0] : category;

if (!categorySlug || categorySlug === " ") {
  throw createError({ statusCode: 404, statusMessage: "Category Page Not Found" });
}

const { find } = useCms();
const { data: page } = await useAsyncData<Page | null>(
  `page-recettes-category-${categorySlug}`,
  async () => {
    const result = await find<Page>("pages", {
      filters: {
        slug: { $eq: `recettes-${categorySlug}` },
        parent: {
          slug: { $eq: "recette" },
        },
      },
      populate: ["content", "seoMeta", "parent"],
      pagination: {
        page: 0,
        pageSize: 1,
      },
    });
    return result.data[0] ?? null;
  },
);

const ariane = useGenerateSchemaArianne(categorySlug);

if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: "Page Not Found" });
}

const displayPage = page.value.content || [];
const titleContent = computed(() => page.value?.title || "No title");
const seo = computed(() => page.value?.seoMeta || {});

useApplySeoMeta({
    title: titleContent.value || "Journal du cuistot",
    description: seo.value?.description || "No description",
    image: "https://journalducuistot.fr/img/logo.webp",
    url: "https://journalducuistot.fr/recette/recettes-" + categorySlug,
    keywords: seo.value?.keywords,
    author: "bertyn",
    articleDatePublished: page.value?.publishedAt,
    articleDateModified: page.value?.updatedAt,
});
useHead({
  link: [
    {
      rel: "canonical",
      href: "https://journalducuistot.fr/recette/recettes-" + categorySlug,
    },
  ],
});
defineOgImageComponent("Cooking", {
  headline: titleContent.value || "Journal du cuistot",
  description: seo.value?.description || "No description",
});
</script>

<template>
  <SchemaOrgBreadcrumb :itemListElement="ariane" />
  <BaseContentDisplay :content="displayPage" />
</template>
