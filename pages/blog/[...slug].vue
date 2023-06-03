<script lang="ts" setup>
definePageMeta({ layout: "content" });

import { Article, Category, Cover } from "~/types/strapiMeta";
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
}>("article", () => find(`articles?filters[slug][$eq]=${slug}&populate=*`));

if (!article) {
  throw createError({ statusCode: 404, statusMessage: "Page Not Found" });
}

const content = useMarked(
  article.value?.data[0].attributes?.content || "No content"
);
const titleContent = computed(
  () => article.value?.data[0].attributes?.title || "No title"
);
const categoriesContent = computed(
  () =>
    article.value?.data[0].attributes?.categories?.data || ([] as Category[])
);
const cover = computed(
  () => article.value?.data[0].attributes?.cover || ({} as Cover)
);

const link = computed(
  () =>
    "https://journalducuistot.fr/blog/" +
      article.value?.data[0].attributes?.slug || ""
);
const date = computed(
  () => article.value?.data[0].attributes?.publishedAt || ""
);

const urlCover = useFormatUrlCover(cover.value, "small");

const categoryRecipe = computed(
  () =>
    article.value?.data[0].attributes?.categories?.data[0].attributes ||
    ({} as Category)
);

// set the meta
useSeoMeta(
  useLoadMeta({
    title: titleContent.value || "Journal du cuistot",
    description:
      "Journal du cuistot | " + article.value?.data[0].attributes?.content,
    image: urlCover || "",
    url: "https://www.journalducuistot.fr/blog/" + slug,
    author: "magius",
    datePublished: article.value?.data[0].attributes?.publishedAt,
    dateModified: article.value?.data[0].attributes?.updatedAt,
  }) as any
);
useHead({
  link: [
    {
      rel: "canonical",
      href: "https://www.journalducuistot.fr/blog/" + slug,
    },
  ],
});
</script>

<template>
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
    :alt="cover.data?.attributes?.alternativeText"
  >
    <template #info>
      <p
        class="flex-[0_0_auto] items-center mx-2 h-6 text-xs leading-6 font-semibold tracking-widest text-black uppercase align-baseline"
      >
        <Icon name="ic:sharp-access-time" class="h-3 w-3 text-gray-500" />
        8 minutes
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
          {{ category.attributes!.name }}
        </span>
      </div>
    </template>
  </SectionHeroArticle>
  <article class="prose md:prose-lg lg:prose-xl" v-html="content"></article>
  <Cta />
  <PrevAndNext />
  <SectionYouMayAlsoLike
    :categorie="categoryRecipe.name"
    type-content="recipes"
  />
</template>
