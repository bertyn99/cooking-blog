<script lang="ts" setup>
definePageMeta({ layout: "content" });

import type { Article, Category, Cover } from "~/types/strapiMeta";
// get current route slug
const {
  params: { slug },
} = useRoute();

if (slug.length === 0 || slug === " ") {
  throw createError({ statusCode: 404, statusMessage: "Page Not Found" });
}

const { find } = useStrapi();

const {
  data: article,
  pending,
  refresh,
  error,
} = await useAsyncData<{
  data: Article[];
}>("article", () =>
  find(`articles`, {
    filters: { slug: { $eq: slug } },
    populate: ["cover", "categories", "seo", "surround"],
    pagination: {
      page: 0,
      pageSize: 1,
    },
  }),{
    transform: (data) => data.data[0] as Article
  }
);

if (!article) {
  throw createError({ statusCode: 404, statusMessage: "Page Not Found" });
}

const content = useMarked(
  article.value?.content || "No content"
);
const titleContent = computed(
  () => article.value?.title || "No title"
);
const categoriesContent = computed(
  () =>
      article.value?.categories || ([] as Category[])
);
const cover = computed(
  () => article.value?.cover || ({} as Cover)
);

const link = computed(
  () =>
    "https://journalducuistot.fr/blog/" +
      article.value?.slug || ""
);
const date = computed(
  () => article.value?.publishedAt || ""
);
const modifiedAt = computed(
  () => article.value?.updatedAt || ""
);
const urlCover = useFormatUrlCover(cover.value);

const categoryRecipe = computed(
  () =>
        article.value?.categories ||
    ({} as Category)
);
const { minutes } = useReadingTime(
  article.value?.content || ""
);

/* const { prev, next } = article.value; */

const seo = computed(() => article.value?.seo || {});
// set the meta
useSeoMeta(
{
    title: titleContent.value || "Journal du cuistot",
    description:
      "Journal du cuistot | " + seo.value?.description || "No description",
    keywords: seo.value?.keywords || "No keyword",
    image: urlCover || "",
    url: "https://journalducuistot.fr/blog/" + slug,
    author: "magius",
    datePublished: article.value?.publishedAt,
    dateModified: article.value?.updatedAt,
  }
);
useHead({
  link: [
    {
      rel: "canonical",
      href: "https://journalducuistot.fr/blog/" + slug,
    },
  ],
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
      { name: titleContent, item: `/${slug}` },
    ]"
  />
  <SchemaOrgArticle
    type="BlogPosting"
    :datePublished="date"
    :dateModified="modifiedAt"
    :author="{
      name: 'bertyn boulikou',
      image: 'https://journalducuistot.fr/img/author.jpg',
    }"
  />
  <div>
    <h1
      itemprop="name"
      class="block mb-4 font-serif text-5xl font-normal text-black align-baseline"
    >
      {{ titleContent }}
    </h1>
    <Share :date="date" :link="link" />
  </div>

  <SectionHeroArticle
    :url="urlCover"
    :alt="cover.attributes?.alternativeText"
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
          v-for="category in categoriesContent"
        >
          <Icon name="ion:ios-pricetag-outline" />
          {{ category.name }}
        </span>
      </div>
    </template>
  </SectionHeroArticle>
  <article class="prose md:prose-lg lg:prose-xl" v-html="content"></article>
  <LazyCta />
<!--   <LazyPrevAndNext :prev="prev?.slug" :next="next?.slug" /> -->
  <LazySectionYouMayAlsoLike
    :categorie="categoryRecipe.name"
    type-content="recipes"
  />
</template>
