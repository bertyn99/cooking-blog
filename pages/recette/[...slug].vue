<script lang="ts" setup>
import { url } from "inspector";
import YouMayAlsoLike from "~/components/section/YouMayAlsoLike.vue";
import { Category, Cover, Ingredient, Recipe, SEO } from "~/types/strapiMeta";

definePageMeta({ layout: "content" });

const {
  params: { slug },
} = useRoute();
const { find } = useStrapi();
const {
  data: recipe,
  pending,
  refresh,
  error,
} = await useAsyncData<Recipe>(`recipe-${slug}`, () =>
  find(`recipes`, {
    filters: { slug: { $eq: slug } },
    populate: ["cover", "categories", "nutrition", "Ingredient", "seo"],
    pagination: {
      page: 0,
      pageSize: 1,
    },
  })
);

if (!recipe) {
  throw createError({ statusCode: 404, statusMessage: "Page Not Found" });
}

const titleContent = computed(
  () => recipe.value?.data[0].attributes?.title || "No title"
);

const time = computed(() => recipe.value?.data[0].attributes?.time || "10");
const difficulty = computed(
  () => recipe.value?.data[0].attributes?.difficulty || "easy"
);
const categoriesRecipe = computed(
  () => recipe.value?.data[0].attributes?.categories?.data || ([] as Category[])
);
const intro = computed(
  () => recipe.value?.data[0].attributes?.Intro || "No intro"
);

const ingredients = computed(
  () => recipe.value?.data[0].attributes?.Ingredient || ([] as Ingredient[])
);

const cover = computed(
  () => recipe.value?.data[0].attributes?.cover || ({} as Cover)
);

const urlCover = useFormatUrlCover(cover.value, "small");
// set the meta

const steps = computed(
  () => recipe.value?.data[0].attributes?.step?.split("\n") || []
);
const link = computed(
  () =>
    "https://journalducuistot.fr/recette/" +
      recipe.value?.data[0].attributes?.slug || ""
);
const date = computed(
  () => recipe.value?.data[0].attributes?.publishedAt || ""
);
const categoryRecipe = computed(
  () =>
    recipe.value?.data[0].attributes?.categories?.data[0].attributes ||
    ({} as Category)
);

const nutrition = computed(
  () => recipe.value?.data[0].attributes?.nutrition || ({} as any)
);

const formated = computed(() =>
  Object.keys(nutrition.value)
    .filter((elm) => elm !== "id")
    .map((key) => {
      return { name: key, value: nutrition.value[key] };
    })
);
const seo = computed(
  () => recipe.value?.data[0].attributes?.seo[0] || ({} as SEO)
);

useSeoMeta(
  useLoadMeta({
    title: titleContent.value || "Journal du cuistot",
    description:
      "Journal du cuistot | " + seo.value?.description || "No description",
    keywords: seo.value?.keywords || "No keyword",
    image: urlCover || "",
    url: "https://www.journalducuistot.fr/" + slug,
    author: "magius",
    datePublished: recipe.value?.data[0].attributes?.publishedAt,
    dateModified: recipe.value?.data[0].attributes?.updatedAt,
  }) as any
);
useHead({
  link: [
    {
      rel: "canonical",
      href: "https://www.journalducuistot.fr/" + slug,
    },
  ],
});
</script>

<template>
  <SchemaOrgBreadcrumb
    :itemListElement="[
      { name: 'Accueil', item: '/' },
      {
        name: 'Recettes',
        item: '/recette',
      },
      { name: titleContent, item: `/${slug}` },
    ]"
  />
  <SchemaOrgArticle
    type="Recipe"
    :name="titleContent"
    :totalTime="time"
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
    :alt="cover.data?.attributes?.alternativeText"
  >
    <template #info>
      <p
        class="items-center mx-2 h-6 text-xs leading-6 font-semibold tracking-widest text-black uppercase align-baseline border-0"
      >
        <Icon name="ic:sharp-access-time" class="h-3 w-3 text-gray-500" />
        {{ time }} min
      </p>
      <p
        class="items-center mx-2 h-6 text-xs leading-6 font-semibold tracking-widest text-black uppercase align-baseline border-0"
      >
        <Icon name="icon-park-outline:good-two" class="h-3 w-3 text-gray-500" />
        {{ difficulty }}
      </p>
      <p
        class="mx-2 h-6 text-xs leading-6 font-semibold tracking-widest text-black uppercase align-baseline border-0"
      >
        <Icon name="mdi:silverware-fork-knife" class="h-3 w-3 text-gray-500" />
        serves 1
      </p>
      <div
        class="p-0 my-0 mx-2 h-6 text-xs font-semibold tracking-widest text-black uppercase align-baseline border-0"
      >
        <span
          itemprop="url"
          class="p-0 m-0 leading-6 uppercase align-baseline border-0 cursor-pointer hover:text-stone-500"
          style="transition: color 0.2s ease-out 0s"
          v-for="category in categoriesContent"
        >
          <Icon name="ion:ios-pricetag-outline" />
          {{ category.attributes!.name }}
        </span>
      </div>
    </template>
  </SectionHeroArticle>
  <div class="prose md:prose-lg lg:prose-xl">
    {{ intro }}
  </div>
  <RecipeReviews />
  <RecipeIngredients :ingredients="ingredients" />
  <RecipeNutritional :data="formated" />
  <RecipeSteps :steps="steps" />
  <Cta />
  <PrevAndNext />
  <SectionYouMayAlsoLike
    :categorie="categoryRecipe.name"
    type-content="recipes"
  />
</template>
