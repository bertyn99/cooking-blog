<script lang="ts" setup>
import type { Category, Cover, Ingredient, Recipe, SEO } from "~/types/strapiMeta";

definePageMeta({ layout: "content" });

const {
  params: { slug },
} = useRoute();

const recipeSlug = Array.isArray(slug) ? slug[0] : slug;

const config = useRuntimeConfig();
const strapiUrl = config.public.cmsBaseUrl;

const { data: recipe } = await useAsyncData<Recipe | null>(`recipe-${recipeSlug}`, async () => {
  const url = `${strapiUrl}/api/recipes?filters[slug][$eq]=${recipeSlug}&populate=*&pagination[page]=1&pagination[pageSize]=1`;
  const response = await $fetch<{ data: Recipe[] }>(url);
  return response.data[0] ?? null;
});

if (!recipe.value) {
  throw createError({ statusCode: 404, statusMessage: "Page Not Found" });
}

const titleContent = computed(() => recipe.value?.title || "No title");
const time = computed(() => recipe.value?.time || "10");
const difficulty = computed(() => recipe.value?.difficulty || "easy");
const categoryRecipe = computed(() => recipe.value?.category || ({} as Category));
const intro = computed(() => recipe.value?.intro || recipe.value?.Intro || "No intro");

const ingredients = computed(
  () => recipe.value?.ingredients || recipe.value?.Ingredient || ([] as Ingredient[]),
);

const cover = computed(() => recipe.value?.cover || ({} as Cover));
const urlCover = useFormatUrlCover(cover.value);

const steps = computed(() => recipe.value?.step?.split("\n\n")[0]?.split("\n") || []);

const link = computed(
  () => "https://journalducuistot.fr/recette/" + (recipe.value?.slug || ""),
);
const date = computed(() => recipe.value?.publishedAt || "");
const dateModified = computed(() => recipe.value?.updatedAt || "");

const dateFormattedDisplay = useDateFormat(date.value.toString(), "YYYY-MM-DD", {
  locales: "en-US",
});
const dateModifiedFormatted = useDateFormat(dateModified.value, "YYYY-MM-DD", {
  locales: "en-US",
});

const nutrition = computed(() => recipe.value?.nutrition || {});

const formated = computed(() =>
  Object.keys(nutrition.value)
    .filter((elm) => elm !== "id")
    .map((key) => {
      return { name: key, value: nutrition.value[key] ?? "" };
    }),
);

const seo = computed(() => {
  const seoValue = recipe.value?.seo;
  return Array.isArray(seoValue) ? seoValue[0] || ({} as SEO) : seoValue || ({} as SEO);
});

useApplySeoMeta({
  title: titleContent.value || "Journal du cuistot",
  description: "Journal du cuistot | " + (seo.value?.description || "No description"),
  keywords: seo.value?.keywords,
  image: urlCover || "",
  url: "https://journalducuistot.fr/recette/" + recipeSlug,
  author: "magius",
  articleDatePublished: recipe.value?.publishedAt,
  articleDateModified: recipe.value?.updatedAt,
});
useHead({
  link: [
    {
      rel: "canonical",
      href: "https://journalducuistot.fr/recette/" + recipeSlug,
    },
  ],
});
</script>

<template>
  <SchemaOrgBreadcrumb :itemListElement="[
    { name: 'Accueil', item: '/' },
    {
      name: 'Recettes',
      item: '/recette',
    },
    { name: titleContent, item: `/recette/${recipeSlug}` },
  ]" />
  <SchemaOrgRecipe :name="titleContent" :totalTime="`PT${time}M`" :datePublished="dateFormattedDisplay"
    :dateModified="dateModifiedFormatted" author="bertyn boulikou" :keywords="seo?.keywords"
    :recipeCategory="categoryRecipe.name" />
  <div>
    <h1 itemprop="name" class="block mb-4 font-serif text-5xl font-normal text-black align-baseline">
      {{ titleContent }}
    </h1>
    <Share :date="date" :link="link" />
  </div>
  <SectionHeroArticle :url="urlCover" :alt="cover.alternativeText">
    <template #info>
      <p
        class="items-center mx-2 h-6 text-xs leading-6 font-semibold tracking-widest text-black uppercase align-baseline border-0">
        <Icon name="ic:sharp-access-time" class="h-3 w-3 text-gray-500" />
        {{ time }} min
      </p>
      <p
        class="items-center mx-2 h-6 text-xs leading-6 font-semibold tracking-widest text-black uppercase align-baseline border-0">
        <Icon name="icon-park-outline:good-two" class="h-3 w-3 text-gray-500" />
        {{ difficulty }}
      </p>
      <p class="mx-2 h-6 text-xs leading-6 font-semibold tracking-widest text-black uppercase align-baseline border-0">
        <Icon name="mdi:silverware-fork-knife" class="h-3 w-3 text-gray-500" />
        serves 1
      </p>
      <div class="p-0 my-0 mx-2 h-6 text-xs font-semibold tracking-widest text-black uppercase align-baseline border-0">
        <span itemprop="url"
          class="p-0 m-0 leading-6 uppercase align-baseline border-0 cursor-pointer hover:text-stone-500"
          style="transition: color 0.2s ease-out 0s">
          <Icon name="ion:ios-pricetag-outline" />
          {{ categoryRecipe.name }}
        </span>
      </div>
    </template>
  </SectionHeroArticle>
  <div class="prose md:prose-lg lg:prose-xl max-w-4xl">
    {{ intro }}
  </div>
  <RecipeReviews />
  <RecipeIngredients :ingredients="ingredients" />
  <RecipeNutritional :data="formated" />
  <LazyRecipeSteps :steps="steps" />
  <LazyCta />
  <LazyPrevAndNext class="print:hidden" />
  <LazySectionYouMayAlsoLike :category="String(categoryRecipe.id ?? 'cuisine-africaine')" type-content="recipes"
    class="print:hidden" />
</template>
