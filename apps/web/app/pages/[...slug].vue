<script lang="ts">
definePageMeta({ layout: "content" });
</script>

<script lang="ts" setup>
import { useGenerateSchemaArianne } from "~/composables/useGenerateSchemaArianne";
import type { CmsFilters } from "~/utils/cms-client";
import type { Page } from "~/types/strapiMeta";

const {
  params: { slug },
} = useRoute();

const slugArray = Array.isArray(slug) ? slug : slug ? [slug] : [];

if (slugArray.length === 0 || slugArray[0] === " ") {
  throw createError({ statusCode: 404, statusMessage: "Page Not Found" });
}

const currentSlug = slugArray[slugArray.length - 1];
const parentSlug = slugArray.length > 1 ? slugArray[slugArray.length - 2] : null;

const { find } = useCms();

const cacheKey = `page-${slugArray.join("-")}`;
const filters: CmsFilters = {
  slug: { $eq: currentSlug },
};

if (parentSlug) {
  filters.parent = {
    slug: { $eq: parentSlug },
  };
}

const { data: page } = await useAsyncData<Page | null>(
  cacheKey,
  async () => {
    const result = await find<Page>("pages", {
      filters,
      pagination: {
        page: 0,
        pageSize: 1,
      },
      populate: {
        content: true,
        seoMeta: true,
        parent: {
          fields: ["slug"],
        },
      },
    });
    return result.data?.[0] ?? null;
  },
);

const ariane = useGenerateSchemaArianne(slugArray);

if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: "Page Not Found" });
}

const pageContent = computed(() => page.value?.content);
const titleContent = computed(() => page.value?.title || "No title");
const seo = computed(() => page.value?.seoMeta || {});

const pagePath = `/${slugArray.join("/")}`;

useApplyPageSeo({
  title: titleContent.value || "Journal du cuistot",
  description: seo.value?.description || "No description",
  image: "/img/logo.webp",
  url: pagePath,
  keywords: seo.value?.keywords,
  articleDatePublished: page.value?.publishedAt,
  articleDateModified: page.value?.updatedAt,
  og: {
    headline: titleContent.value,
    description: seo.value?.description || "No description",
  },
});
</script>

<template>
  <SchemaOrgBreadcrumb :itemListElement="ariane" />
  <BasePageBody :content="pageContent" />
</template>
