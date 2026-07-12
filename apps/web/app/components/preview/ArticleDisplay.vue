<script lang="ts" setup>
import type { Article, Category, Cover } from "~/types/strapiMeta";

const { article } = defineProps<{
    article: Article;
}>();

const content = computed(() => article?.content || "No content");
const titleContent = computed(() => article?.title || "No title");
const categoriesContent = computed(() => article?.categories || ([] as Category[]));
const cover = computed(() => article?.cover || ({} as Cover));
const urlCover = useFormatUrlCover(cover.value);

const link = computed(() => "https://journalducuistot.fr/blog/" + (article?.category?.slug || 'uncategorized') + "/" + (article?.slug || ""));
const date = computed(() => article?.publishedAt || "");
const modifiedAt = computed(() => article?.updatedAt || "");

const categoryRecipe = computed(() => article?.category || ({} as Category));
const { minutes } = useReadingTime(article?.content || "");

const seo = computed(() => article?.seo || {});
</script>

<template>
    <SchemaOrgBreadcrumb :itemListElement="[
        { name: 'Accueil', item: '/' },
        { name: 'Blog', item: '/blog' },
        {
            name: categoryRecipe.name || 'Uncategorized',
            item: `/blog/${categoryRecipe.slug || 'uncategorized'}`
        },
        {
            name: titleContent,
            item: `/blog/${categoryRecipe.slug || 'uncategorized'}/${article?.slug}`
        },
    ]" />
    <SchemaOrgArticle type="BlogPosting" :datePublished="date" :dateModified="modifiedAt" :author="{
        name: 'bertyn boulikou',
        image: 'https://journalducuistot.fr/img/author.jpg',
    }" />

    <div>
        <h1 itemprop="name" class="block mb-4 font-serif text-5xl font-normal text-black align-baseline">
            {{ titleContent }}
        </h1>
        <Share :date="date" :link="link" />
    </div>

    <SectionHeroArticle :url="urlCover" :alt="cover?.alternativeText || titleContent">
        <template #info>
            <p
                class="flex-[0_0_auto] items-center mx-2 h-6 text-xs leading-6 font-semibold tracking-widest text-black uppercase align-baseline">
                <Icon name="ic:sharp-access-time" class="h-3 w-3 text-gray-500" />
                {{ minutes }} minutes
            </p>

            <div
                class="flex-[0_0_auto] p-0 my-0 mx-2 h-6 text-xs font-semibold tracking-widest text-black uppercase align-baseline">
                <span itemprop="url"
                    class="p-0 m-0 leading-6 uppercase align-baseline cursor-pointer hover:text-stone-500"
                    style="transition: color 0.2s ease-out 0s" v-for="category in categoriesContent" :key="category.id">
                    <Icon name="ion:ios-pricetag-outline" />
                    {{ category.name }}
                </span>
            </div>
        </template>
    </SectionHeroArticle>

    <MDC class="prose md:prose-lg lg:prose-xl" :value="content" tag="article"></MDC>
    <LazyCta />
    <LazySectionYouMayAlsoLike :category="categoryRecipe.id" type-content="articles" />
</template>
