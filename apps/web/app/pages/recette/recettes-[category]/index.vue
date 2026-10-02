<script lang="ts">
definePageMeta({ layout: "content" });
</script>

<script lang="ts" setup>
import { useGenerateSchemaArianne } from "~/composables/useGenerateSchemaArianne";
import type { CmsPage } from "~/types/cms";

const route = useRoute();

const categorySlug = computed(() => {
  const category = route.params.category;
  return Array.isArray(category) ? category[0] : category;
});

if (!categorySlug.value || categorySlug.value === " ") {
  throw createError({ statusCode: 404, statusMessage: "Category Page Not Found" });
}

const cms = useCms();
const ariane = computed(() => useGenerateSchemaArianne(categorySlug.value ?? ""));
const { data: page, status } = await useAsyncData<CmsPage | null>(
  () => `page-recettes-category-${categorySlug.value}`,
  async () => {
    const slug = Array.isArray(route.params.category) ? route.params.category[0] : route.params.category;
    if (!slug) return null;
    const result = await cms.pages({
      slug: `recettes-${slug}`,
      parentSlug: "recette",
      include: ["seoMeta", "parent"],
      page: 1,
      pageSize: 1,
    });
    return result.data[0] ?? null;
  },
  { watch: [categorySlug] },
);

watch([page, status], ([next, currentStatus]) => {
  if (currentStatus === "pending") return;
  if (!next) {
    showError({ statusCode: 404, statusMessage: "Page Not Found" });
    return;
  }
  clearError();
}, { immediate: true });

if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: "Page Not Found" });
}

const pageContent = computed(() => page.value?.content);
const titleContent = computed(() => page.value?.title || "No title");
const seo = computed(() => page.value?.seoMeta || {});

const categoryPath = computed(() => `/recette/recettes-${categorySlug.value}`);

useApplyPageSeo(computed(() => ({
  title: titleContent.value || "Journal du cuistot",
  description: seo.value?.description || "No description",
  image: "/img/logo.webp",
  url: categoryPath.value,
  keywords: seo.value?.keywords,
  author: SITE_AUTHOR_NAME,
  articleDatePublished: page.value?.publishedAt,
  articleDateModified: page.value?.updatedAt,
  og: {
    headline: titleContent.value || "Journal du cuistot",
    description: seo.value?.description || "No description",
  },
})));
</script>

<template>
  <SchemaOrgBreadcrumb :itemListElement="ariane" />
  <BasePageBody :content="pageContent" />
</template>
