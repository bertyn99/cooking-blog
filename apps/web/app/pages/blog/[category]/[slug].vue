<script lang="ts">
definePageMeta({ layout: "content" });
</script>

<script lang="ts" setup>
import type { Article, Category, Cover } from "~/types/strapiMeta";

const route = useRoute();

const categorySlug = computed(() => {
  const category = route.params.category;
  return Array.isArray(category) ? category[0] : category;
});
const articleSlug = computed(() => {
  const slug = route.params.slug;
  return Array.isArray(slug) ? slug[0] : slug;
});

if (!articleSlug.value || articleSlug.value === " " || !categorySlug.value || categorySlug.value === " ") {
  throw createError({ statusCode: 404, statusMessage: "Page Not Found" });
}

const cms = useCms();

const { data: article, status } = await useAsyncData<Article | null>(
  () => `article:${categorySlug.value}:${articleSlug.value}`,
  async () => {
    const category = Array.isArray(route.params.category) ? route.params.category[0] : route.params.category;
    const slug = Array.isArray(route.params.slug) ? route.params.slug[0] : route.params.slug;
    if (!slug || !category) return null;
    const result = await cms.articles({
      slug,
      categorySlug: category,
      include: "*",
      page: 1,
      pageSize: 1,
    });
    return result.data[0] ?? null;
  },
  { watch: [categorySlug, articleSlug] },
);

watch([article, status], ([next, currentStatus]) => {
  if (currentStatus === "pending") return;
  if (!next) {
    showError({ statusCode: 404, statusMessage: "Page Not Found" });
    return;
  }
  clearError();
}, { immediate: true });

if (!article.value) {
  throw createError({ statusCode: 404, statusMessage: "Page Not Found" });
}

const content = computed(() => article.value?.content || "No content");
const titleContent = computed(() => article.value?.title || "No title");
const categoriesContent = computed(() => {
  if (article.value?.categories?.length) return article.value.categories;
  return article.value?.category ? [article.value.category] : [];
});
const cover = computed(() => article.value?.cover || ({} as Cover));

const urlCover = computed(() =>
  formatCoverUrlFromSource({
    cover: article.value?.cover,
    coverBlobPathname: article.value?.coverBlobPathname,
    slug: article.value?.slug,
    title: article.value?.title,
  }),
);

const pagePath = computed(() => `/blog/${categorySlug.value}/${articleSlug.value}`);
const pageUrl = computed(() => useSitePageUrl(pagePath.value));
const coverSource = computed(() => ({
  cover: article.value?.cover,
  coverBlobPathname: article.value?.coverBlobPathname,
  slug: article.value?.slug,
  title: article.value?.title,
}));
const authorImageUrl = useSitePageUrl("/img/author.jpg");

const link = computed(() => pageUrl.value);
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

useApplyPageSeo(computed(() => ({
  title: titleContent.value || "Journal du cuistot",
  description: metaDescription.value,
  keywords: seo.value?.keywords,
  image: formatCoverOgImagePath(coverSource.value) || "/img/logo.webp",
  url: pagePath.value,
  author: SITE_AUTHOR_NAME,
  articleDatePublished: article.value?.publishedAt,
  articleDateModified: article.value?.updatedAt,
  og: {
    headline: titleContent.value,
    description: metaDescription.value,
  },
})));
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
    :category="categoryRecipe.slug ?? ''"
    type-content="articles"
  />
</template>
