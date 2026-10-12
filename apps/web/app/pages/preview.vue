<script lang="ts">
definePageMeta({ layout: "content" });
</script>

<script lang="ts" setup>
import { useGenerateSchemaArianne } from "~/composables/useGenerateSchemaArianne";
import type { Article, GlossaryTerm, Recipe } from "~/types/strapiMeta";
import type { CmsPage } from "~/types/cms";

const route = useRoute();
const { slug, type } = route.query;

if (!slug || !type) {
  throw createError({
    statusCode: 404,
    statusMessage: "Not Found",
  });
}

const contentType = type as string;
const contentSlug = slug as string;

const validTypes = ["page", "recipe", "article", "glossary"] as const;
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

const cacheKey = `preview-${contentType}-${contentSlug}`;

const { data: payload, error: fetchError } = await useAsyncData(
  cacheKey,
  () => $fetch<{ type: string, data: CmsPage | Recipe | Article | GlossaryTerm }>("/api/preview-content", {
    query: { type: contentType, slug: contentSlug },
  }),
);

if (fetchError.value) {
  const status = (fetchError.value as { statusCode?: number }).statusCode || 500;
  throw createError({
    statusCode: status === 404 ? 404 : 500,
    statusMessage: status === 404 ? "Content not found" : "Error fetching preview content",
  });
}

const content = computed(() => payload.value?.data ?? null);

if (!content.value) {
  throw createError({
    statusCode: 404,
    statusMessage: "Content not found",
  });
}

const titleContent = computed(() => {
  const value = content.value;
  if (!value) return "No title";
  if (contentType === "glossary") {
    const term = value as GlossaryTerm;
    return term.name || term.title || "No title";
  }
  if ("title" in value && value.title) return value.title;
  if ("name" in value && value.name) return value.name;
  return "No title";
});
const seo = computed(() => {
  const value = content.value;
  if (!value || !("seo" in value)) {
    return "seoMeta" in (value || {}) ? (value as CmsPage).seoMeta || {} : {};
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
      <BasePageBody :content="(content as CmsPage)?.content" />
    </div>

    <div v-else-if="contentType === 'recipe'">
      <PreviewRecipeDisplay :recipe="content as Recipe" />
    </div>

    <div v-else-if="contentType === 'article'">
      <PreviewArticleDisplay :article="content as Article" />
    </div>

    <div v-else-if="contentType === 'glossary'">
      <h1 class="mb-4 font-serif text-5xl font-normal text-black">
        {{ titleContent }}
      </h1>
      <p
        v-if="(content as GlossaryTerm)?.description"
        class="mb-6 max-w-2xl text-lg text-stone-600"
      >
        {{ (content as GlossaryTerm).description }}
      </p>
      <BaseMarkdownContent
        v-if="(content as GlossaryTerm)?.content"
        :markdown="(content as GlossaryTerm).content || ''"
        tag="article"
      />
    </div>
  </div>
</template>
