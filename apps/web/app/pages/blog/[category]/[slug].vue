<script lang="ts">
definePageMeta({ layout: "content" });
</script>

<script lang="ts" setup>
import type { Article, Category, Cover } from "~/types/strapiMeta";

const {
  params: { category, slug },
} = useRoute();

const categorySlug = Array.isArray(category) ? category[0] : category;
const articleSlug = Array.isArray(slug) ? slug[0] : slug;

if (!articleSlug || articleSlug === " " || !categorySlug || categorySlug === " ") {
  throw createError({ statusCode: 404, statusMessage: "Page Not Found" });
}

const { find } = useCms();

const { data: article } = await useAsyncData<Article | null>("article", async () => {
  const result = await find<Article>("articles", {
    filters: { slug: { $eq: articleSlug } },
    populate: "*",
    pagination: { page: 1, pageSize: 1 },
  });
  return result.data[0] ?? null;
});

if (!article.value) {
  throw createError({ statusCode: 404, statusMessage: "Page Not Found" });
}

const content = computed(() => article.value?.content || "No content");
const titleContent = computed(() => article.value?.title || "No title");
const categoriesContent = computed(() => article.value?.categories || ([] as Category[]));
const cover = computed(() => article.value?.cover || ({} as Cover));

const urlCover = computed(() =>
  formatCoverUrlFromSource({
    cover: article.value?.cover,
    coverBlobPathname: article.value?.coverBlobPathname,
    slug: article.value?.slug,
    title: article.value?.title,
  }),
);

const pagePath = `/blog/${categorySlug}/${articleSlug}`;
const pageUrl = useSitePageUrl(pagePath);
const coverSource = {
  cover: article.value?.cover,
  coverBlobPathname: article.value?.coverBlobPathname,
  slug: article.value?.slug,
  title: article.value?.title,
};
const authorImageUrl = useSitePageUrl("/img/author.jpg");

const link = computed(() => pageUrl);
const date = computed(() => article.value?.publishedAt || "");
const modifiedAt = computed(() => article.value?.updatedAt || "");

const categoryRecipe = computed(() => article.value?.category || ({} as Category));
const { minutes } = useReadingTime(article.value?.content || "");

const seo = computed(() => {
  const seoValue = article.value?.seo;
  return Array.isArray(seoValue) ? seoValue[0] || {} : seoValue || {};
});

const metaDescription = computed(
  () =>
    seo.value?.description ||
    `Article sur le Journal du cuistot : ${titleContent.value}`,
);

useApplyPageSeo({
  title: titleContent.value || "Journal du cuistot",
  description: metaDescription.value,
  keywords: seo.value?.keywords,
  image: formatCoverOgImagePath(coverSource) || "/img/logo.webp",
  url: pagePath,
  author: SITE_AUTHOR_NAME,
  articleDatePublished: article.value?.publishedAt,
  articleDateModified: article.value?.updatedAt,
  og: {
    headline: titleContent.value,
    description: metaDescription.value,
  },
});
</script>

<template>
  <SchemaOrgBreadcrumb
    :itemListElement="[
      { name: 'Accueil', item: '/' },
      {
        name: 'Blog',
        item: '/blog',
      },
      {
        name: categorySlug,
        item: `/blog/${categorySlug}`,
      },
      {
        name: titleContent,
        item: `/blog/${categorySlug}/${articleSlug}`,
      },
    ]"
  />
  <SchemaOrgArticle
    type="BlogPosting"
    :datePublished="date"
    :dateModified="modifiedAt"
    :author="{
      name: SITE_AUTHOR_NAME,
      image: authorImageUrl,
    }"
  />
  <div>
    <h1
      itemprop="name"
      class="block mb-4 font-serif text-5xl font-normal text-black align-baseline"
    >
      {{ titleContent }}
    </h1>
    <Share :date="date || ''" :link="link || ''" />
  </div>

  <SectionHeroArticle
    :url="urlCover"
    :alt="cover.alternativeText || cover.attributes?.alternativeText"
  >
    <template #info>
      <p
        class="flex-[0_0_auto] items-center mx-2 h-6 text-xs leading-6 font-semibold tracking-widest text-black uppercase align-baseline"
      >
        <Icon name="ic:sharp-access-time" class="h-3 w-3 text-gray-500" />
        {{ minutes }} minutes
      </p>

      <div
        class="flex-[0_0_auto] p-0 my-0 mx-2 h-6 text-xs font-semibold tracking-widest text-black uppercase align-baseline"
      >
        <span
          itemprop="url"
          class="p-0 m-0 leading-6 uppercase align-baseline cursor-pointer hover:text-stone-500"
          style="transition: color 0.2s ease-out 0s"
          v-for="cat in categoriesContent"
          :key="cat.id"
        >
          <Icon name="ion:ios-pricetag-outline" />
          {{ cat.name }}
        </span>
      </div>
    </template>
  </SectionHeroArticle>
  <BaseMarkdownContent :markdown="content" tag="article" />
  <LazyCta />
  <LazySectionYouMayAlsoLike
    :category="String(categoryRecipe.id ?? '')"
    type-content="articles"
  />
</template>
