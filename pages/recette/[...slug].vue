<script lang="ts" setup>
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
    populate: ["cover", "categories", "nutrition", "Ingredient", "seo", "tags"],
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
  () => recipe.value?.data[0].attributes?.categories?.data || []
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

const urlCover = useFormatUrlCover(cover.value);
// set the meta

const recipeNote = computed(
  () => recipe.value?.data![0].attributes?.step?.split("\n\n")[1] || []
);
const steps = computed(
  () =>
    recipe.value?.data![0].attributes?.step?.split("\n\n")[0].split("\n") || []
);

const tags = computed(
  () =>
    recipe.value?.data[0].attributes?.tags?.data.map(
      (elm: any) => elm.attributes.name
    ) || []
);

const link = computed(
  () =>
    "https://journalducuistot.fr/recette/" +
      recipe.value?.data[0].attributes?.slug || ""
);
const date = computed(
  () => recipe.value?.data[0].attributes?.publishedAt || ""
);
const dateModified = computed(
  () => recipe.value?.data[0].attributes?.updatedAt || ""
);

const dateFormattedDisplay = useDateFormat(
  date.value.toString(),
  "YYYY-MM-DD",
  {
    locales: "en-US",
  }
);
const dateModifiedFormatted = useDateFormat(dateModified.value, "YYYY-MM-DD", {
  locales: "en-US",
});

const categoryRecipe = computed(() =>
  categoriesRecipe.value.length > 0
    ? categoriesRecipe.value[0].attributes!.name
    : "cuisine africaine"
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
    url: "https://journalducuistot.fr/recette/" + slug,
    author: "magius",
    datePublished: recipe.value?.data[0].attributes?.publishedAt,
    dateModified: recipe.value?.data[0].attributes?.updatedAt,
  }) as any
);
useHead({
  link: [
    {
      rel: "canonical",
      href: "https://journalducuistot.fr/recette/" + slug,
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
  <SchemaOrgRecipe
    :name="titleContent"
    :totalTime="`PT${time}M`"
    :datePublished="dateFormattedDisplay"
    :dateModified="dateModifiedFormatted"
    :author="{
      name: 'bertyn boulikou',
      image: 'https://journalducuistot.fr/img/author.jpg',
    }"
    :keywords="seo.value?.keywords"
    :recipeCuisine="categoryRecipe"
    :recipeCategory="tags[0]"
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
          v-for="category in categoriesRecipe"
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
  <LazyRecipeSteps :steps="steps" />
  <LazyCta />
  <LazyPrevAndNext class="print:hidden" />
  <LazySectionYouMayAlsoLike
    :categorie="categoryRecipe.name || 'cuisine africaine'"
    type-content="recipes"
    class="print:hidden"
  />
</template>
