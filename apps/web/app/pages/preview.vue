<script lang="ts" setup>
definePageMeta({ layout: "content" });

import { useGenerateSchemaArianne } from "~/composables/useGenerateSchemaArianne";
import type { Article, Category, Cover, Recipe } from "~/types/strapiMeta";

const route = useRoute();
const { slug, type } = route.query;

// Validate required query parameters
if (!slug || !type) {
    throw createError({
        statusCode: 400,
        statusMessage: "Missing required query parameters: slug and type"
    });
}

const contentType = type as string;
const contentSlug = slug as string;

// Validate content type
const validTypes = ['page', 'recipe', 'article'];
if (!validTypes.includes(contentType)) {
    throw createError({
        statusCode: 400,
        statusMessage: `Invalid content type. Must be one of: ${validTypes.join(', ')}`
    });
}

// Parse nested slug structure (e.g., "category/article-slug")
const slugParts = contentSlug.split('/');
const isNestedSlug = slugParts.length > 1;
const categorySlug: string | null = isNestedSlug && slugParts[0] ? slugParts[0] : null;
const articleSlug: string = isNestedSlug && slugParts[1] ? slugParts[1] : contentSlug;

console.log('Parsed slug:', { categorySlug, articleSlug, isNestedSlug });

const { find } = useStrapi();

// Create a unique key for caching
const cacheKey = `preview-${contentType}-${contentSlug}`;

let content: any = null;
let error: any = null;

// Fetch content based on type
switch (contentType) {
    case 'page':
        const { data: page } = await useAsyncData<Article | null>(cacheKey, async () => {
            try {
                const filters: any = { slug: { $eq: articleSlug } };

                // Add parent filter if we have a nested slug
                if (isNestedSlug && categorySlug) {
                    filters.parent = {
                        slug: { $eq: categorySlug },
                    };
                }

                const result = await find<Article>('pages', {
                    filters,
                    pagination: { page: 0, pageSize: 1 },
                    populate: {
                        content: true,
                        seoMeta: true,
                        parent: {
                            fields: ['slug'],
                        },
                    } as any,
                });
                return result.data?.[0] || null;
            } catch (err) {
                error = err;
                return null;
            }
        });
        content = page;
        break;

    case 'recipe':
        const { data: recipe } = await useAsyncData<Recipe | null>(cacheKey, async () => {
            try {
                const result = await find<Recipe>('recipes', {
                    filters: { slug: { $eq: articleSlug } },
                    populate: ["cover", "category", "nutrition", "ingredients", "seo"] as any,
                    pagination: { page: 0, pageSize: 1 },
                });
                return result.data?.[0] || null;
            } catch (err) {
                error = err;
                return null;
            }
        });
        content = recipe;
        break;

    case 'article':
        const { data: article } = await useAsyncData<Article | null>(cacheKey, async () => {
            try {
                const filters: any = { slug: { $eq: articleSlug } };

                // Add category filter if we have a nested slug
                if (isNestedSlug && categorySlug) {
                    filters.category = {
                        slug: { $eq: categorySlug },
                    };
                }

                const result = await find<Article>('articles', {
                    filters,
                    populate: ["cover", "category", "seo", "surround"] as any,
                    pagination: { page: 0, pageSize: 1 },
                });
                return result.data?.[0] || null;
            } catch (err) {
                error = err;
                return null;
            }
        });
        content = article;
        break;
}

// Handle errors
if (error) {
    throw createError({
        statusCode: 500,
        statusMessage: "Error fetching preview content"
    });
}

if (!content.value) {
    throw createError({
        statusCode: 404,
        statusMessage: "Content not found"
    });
}

// Set up content-specific data
const titleContent = computed(() => content.value?.title || "No title");
const seo = computed(() => content.value?.seo || content.value?.seoMeta || {});

// Set up meta tags for preview
useSeoMeta({
    title: `[PREVIEW] ${titleContent.value}`,
    description: seo.value?.description || "Preview content",
    robots: 'noindex, nofollow',
});

// Set up head
useHead({
    title: `[PREVIEW] ${titleContent.value}`,
    meta: [
        { name: 'robots', content: 'noindex, nofollow' },
    ],
});

// Generate breadcrumb for pages and articles with nested slugs
const ariane = (() => {
    if (contentType === 'page') {
        if (isNestedSlug && categorySlug) {
            return useGenerateSchemaArianne([categorySlug, articleSlug]);
        } else {
            return useGenerateSchemaArianne([articleSlug]);
        }
    } else if (contentType === 'article' && isNestedSlug && categorySlug) {
        return useGenerateSchemaArianne([categorySlug, articleSlug]);
    }
    return null;
})();
</script>

<template>
    <!-- Preview Banner -->
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

    <!-- Content Display -->
    <div class="max-w-7xl mx-auto px-4 py-8">
        <!-- Page Content -->
        <div v-if="contentType === 'page'">
            <SchemaOrgBreadcrumb v-if="ariane" :itemListElement="ariane" />
            <BaseContentDisplay :content="content?.content || []" />
        </div>

        <!-- Recipe Content -->
        <div v-else-if="contentType === 'recipe'">
            <PreviewRecipeDisplay :recipe="content" />
        </div>

        <!-- Article Content -->
        <div v-else-if="contentType === 'article'">
            <PreviewArticleDisplay :article="content" />
        </div>
    </div>
</template>
