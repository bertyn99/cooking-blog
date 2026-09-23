<script lang="ts">
definePageMeta({ layout: "content" });
</script>

<script lang="ts" setup>
import { useGenerateSchemaArianne } from "~/composables/useGenerateSchemaArianne";
import type { CmsPage } from "~/types/cms";

const route = useRoute();
const cms = useCms();

function slugPartsFromParam(slug: unknown): string[] {
  if (Array.isArray(slug)) return slug.filter(Boolean).map(String);
  if (typeof slug === "string" && slug.trim()) return [slug];
  return [];
}

const slugArray = computed(() => slugPartsFromParam(route.params.slug));

if (slugArray.value.length === 0 || slugArray.value[0] === " ") {
  throw createError({ statusCode: 404, statusMessage: "Page Not Found" });
}

const ariane = computed(() => useGenerateSchemaArianne(slugArray.value));

const { data: page, status } = await useAsyncData<CmsPage | null>(
  () => `page:${slugArray.value.join("/")}`,
  async () => {
    const parts = slugPartsFromParam(route.params.slug);
    const currentSlug = parts[parts.length - 1];
    const parentSlug = parts.length > 1 ? parts[parts.length - 2] : undefined;
    if (!currentSlug) return null;
    const result = await cms.pages({
      slug: currentSlug,
      parentSlug,
      include: ["seoMeta", "parent"],
      page: 1,
      pageSize: 1,
    });
    return result.data?.[0] ?? null;
  },
  { watch: [() => route.params.slug] },
);

watch(
  [page, status],
  async ([next, currentStatus]) => {
    if (currentStatus === "pending") return;
    if (!next) {
      showError({ statusCode: 404, statusMessage: "Page Not Found" });
      return;
    }
    clearError();
    if (next.isHome) {
      await navigateTo("/", { redirectCode: 301, replace: true });
    }
  },
  { immediate: true },
);

if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: "Page Not Found" });
}

if (page.value.isHome) {
  await navigateTo("/", { redirectCode: 301, replace: true });
}

useApplyPageSeo(computed(() => {
  const current = page.value;
  const parts = slugArray.value;
  const seo = current?.seoMeta || {};
  const pagePath = `/${parts.join("/")}`;
  return {
    title: current?.title || "Journal du cuistot",
    description: seo.description || "No description",
    image: "/img/logo.webp",
    url: current?.isHome ? "/" : pagePath,
    keywords: seo.keywords,
    robots: seo.metaRobots ?? undefined,
    articleDatePublished: current?.publishedAt,
    articleDateModified: current?.updatedAt,
    og: {
      headline: current?.title || "No title",
      description: seo.description || "No description",
    },
  };
}));

const pageContent = computed(() => page.value?.content);
</script>

<template>
  <SchemaOrgBreadcrumb :itemListElement="ariane" />
  <BasePageBody :content="pageContent" />
</template>
