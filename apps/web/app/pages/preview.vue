<script lang="ts">
definePageMeta({ layout: "content" });
</script>

<script lang="ts" setup>
import { useGenerateSchemaArianne } from "~/composables/useGenerateSchemaArianne";
import type { CmsFilters } from "~/utils/cms-client";
import type { Article, Page, Recipe } from "~/types/strapiMeta";

const route = useRoute();
const { slug, type } = route.query;

if (!slug || !type) {
  throw createError({
    statusCode: 400,
    statusMessage: "Missing required query parameters: slug and type",
  });
}

const contentType = type as string;
const contentSlug = slug as string;

const validTypes = ["page", "recipe", "article"] as const;
if (!validTypes.includes(contentType as (typeof validTypes)[number])) {
  throw createError({
    statusCode: 400,
    statusMessage: `Invalid content type. Must be one of: ${validTypes.join(", ")}`,
  });
}

const slugParts = contentSlug.split("/");
const isNestedSlug = slugParts.length > 1;
const categorySlug: string | null = isNestedSlug && slugParts[0] ? slugParts[0] : null;
const articleSlug: string = isNestedSlug && slugParts[1] ? slugParts[1] : contentSlug;

const { find } = useCms();
const cacheKey = `preview-${contentType}-${contentSlug}`;

const { data: content, error: fetchError } = await useAsyncData<Page | Recipe | Article | null>(
  cacheKey,
  async () => {
    try {
      if (contentType === "page") {
        const filters: CmsFilters = { slug: { $eq: articleSlug } };
        if (isNestedSlug && categorySlug) {
          filters.parent = { slug: { $eq: categorySlug } };
        }
        const result = await find<Page>("pages", {
          filters,
          pagination: { page: 0, pageSize: 1 },
          populate: {
            content: true,
            seoMeta: true,
            parent: { fields: ["slug"] },
          },
        });
        return result.data?.[0] ?? null;
      }

      if (contentType === "recipe") {
        const result = await find<Recipe>("recipes", {
          filters: { slug: { $eq: articleSlug } },
          populate: ["cover", "category", "nutrition", "ingredients", "utensils", "seo"],
          pagination: { page: 0, pageSize: 1 },
        });
        return result.data?.[0] ?? null;
      }

      if (contentType === "article") {
        const filters: CmsFilters = { slug: { $eq: articleSlug } };
        if (isNestedSlug && categorySlug) {
          filters.category = { slug: { $eq: categorySlug } };
        }
        const result = await find<Article>("articles", {
          filters,
          populate: ["cover", "category", "seo", "surround"],
          pagination: { page: 0, pageSize: 1 },
        });
        return result.data?.[0] ?? null;
      }

      return null;
    } catch {
      return null;
    }
  },
);

if (fetchError.value) {
  throw createError({
    statusCode: 500,
    statusMessage: "Error fetching preview content",
  });
}

if (!content.value) {
  throw createError({
    statusCode: 404,
    statusMessage: "Content not found",
  });
}

const titleContent = computed(() => content.value?.title || "No title");
const seo = computed(() => {
  const value = content.value;
  if (!value || !("seo" in value)) {
    return "seoMeta" in (value || {}) ? (value as Page).seoMeta || {} : {};
  }
  const seoValue = value.seo;
  return Array.isArray(seoValue) ? seoValue[0] || {} : seoValue || {};
});

useSeoMeta({
  title: `[PREVIEW] ${titleContent.value}`,
  description: seo.value?.description || "Preview content",
  robots: "noindex, nofollow",
});

useHead({
  title: `[PREVIEW] ${titleContent.value}`,
  meta: [{ name: "robots", content: "noindex, nofollow" }],
});

const ariane = (() => {
  if (contentType === "page") {
    if (isNestedSlug && categorySlug) {
      return useGenerateSchemaArianne([categorySlug, articleSlug]);
    }
    return useGenerateSchemaArianne([articleSlug]);
  }
  if (contentType === "article" && isNestedSlug && categorySlug) {
    return useGenerateSchemaArianne([categorySlug, articleSlug]);
  }
  return null;
})();
</script>

<template>
  <div class="bg-yellow-100 border-b-4 border-yellow-500 p-4">
    <div class="max-w-7xl mx-auto flex items-center justify-between">
      <div class="flex items-center space-x-2">
        <Icon name="heroicons:eye" class="w-5 h-5 text-yellow-600" />
        <span class="font-semibold text-yellow-800">PREVIEW MODE</span>
        <span class="text-yellow-700">- {{ contentType.toUpperCase() }}: {{ contentSlug }}</span>
      </div>
      <div class="text-sm text-yellow-700">
        This is a preview. Content may not be published yet.
      </div>
    </div>
  </div>

  <div class="max-w-7xl mx-auto px-4 py-8">
    <div v-if="contentType === 'page'">
      <SchemaOrgBreadcrumb v-if="ariane" :itemListElement="ariane" />
      <BasePageBody :content="(content as Page)?.content" />
    </div>

    <div v-else-if="contentType === 'recipe'">
      <PreviewRecipeDisplay :recipe="content as Recipe" />
    </div>

    <div v-else-if="contentType === 'article'">
      <PreviewArticleDisplay :article="content as Article" />
    </div>
  </div>
</template>
