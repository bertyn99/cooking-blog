<script lang="ts" setup>
import type { Category, Cover, Ingredient, Recipe, RecipeUtensil, SEO } from "~/types/strapiMeta";
import { parseFaqItems } from "@journalducuistot/shared/content-blocks";
import { recipeOriginCuisineText } from "@journalducuistot/shared/recipe-origin";
import { markdownToPlainText } from "~/utils/markdown-plain-text";

definePageMeta({
  layout: "content",
  path: "/recette/:slug([^_][^/]*)",
});

const route = useRoute();

const recipeSlug = computed(() => {
  const slug = route.params.slug;
  return Array.isArray(slug) ? slug[0] : slug;
});

const cms = useCms();

const { data: recipe, status } = await useAsyncData<Recipe | null>(
  () => `recipe:${recipeSlug.value}`,
  async () => {
    const slug = Array.isArray(route.params.slug) ? route.params.slug[0] : route.params.slug;
    if (!slug) return null;
    const result = await cms.recipes({
      slug,
      include: "*",
      page: 1,
      pageSize: 1,
    });
    return result.data[0] ?? null;
  },
  { watch: [recipeSlug] },
);

watch([recipe, status], ([next, currentStatus]) => {
  if (currentStatus === "pending") return;
  if (!next) {
    showError({ statusCode: 404, statusMessage: "Page Not Found" });
    return;
  }
  clearError();
}, { immediate: true });

if (!recipe.value) {
  throw createError({ statusCode: 404, statusMessage: "Page Not Found" });
}

const titleContent = computed(() => recipe.value?.title || "No title");
const time = computed(() => recipe.value?.time || "10");
const difficulty = computed(() => recipe.value?.difficulty || "easy");
const categoryRecipe = computed(() => recipe.value?.category || ({} as Category));
const intro = computed(() => recipe.value?.intro || recipe.value?.Intro || "No intro");

// Culinary traditions for Recipe schema.org recipeCuisine (e.g. "Indienne, Japonaise")
// Falls back to "Française" — GSC requires a non-empty recipeCuisine.
const recipeCuisine = computed(() => recipeOriginCuisineText(recipe.value?.origin) || "Française");
// SchemaOrgRecipe types `author`/`keywords` strictly: name object + string array.
const recipeKeywords = computed(() => {
  const value = seo.value?.keywords;
  return value ? [value] : undefined;
});

const ingredients = computed(
  () => recipe.value?.ingredients || recipe.value?.Ingredient || ([] as Ingredient[]),
);

const utensils = computed(
  () => recipe.value?.utensils || ([] as RecipeUtensil[]),
);

const cover = computed(() => recipe.value?.cover || ({} as Cover));
const urlCover = computed(() =>
  formatCoverUrlFromSource({
    cover: recipe.value?.cover,
    coverBlobPathname: recipe.value?.coverBlobPathname,
    slug: recipe.value?.slug,
    title: recipe.value?.title,
  }),
);

const pagePath = computed(() => `/recette/${recipeSlug.value}`);
const pageUrl = computed(() => useSitePageUrl(pagePath.value));
const coverSource = computed(() => ({
  cover: recipe.value?.cover,
  coverBlobPathname: recipe.value?.coverBlobPathname,
  slug: recipe.value?.slug,
  title: recipe.value?.title,
}));

const link = computed(() => pageUrl.value);

const steps = computed(() =>
  (recipe.value?.step || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
);

const faqItems = computed(() => parseFaqItems(recipe.value?.faq));

const date = computed(() => recipe.value?.publishedAt || "");
const dateModified = computed(() => recipe.value?.updatedAt || "");

const dateFormattedDisplay = useDateFormat(date.value.toString(), "YYYY-MM-DD", {
  locales: "en-US",
});
const dateModifiedFormatted = useDateFormat(dateModified.value, "YYYY-MM-DD", {
  locales: "en-US",
});

const nutrition = computed(() => recipe.value?.nutrition || {});

// Recipe schema.org: single NutritionInformation object (GSC rejects arrays),
// unit enums expanded to French labels, instruction numbering stripped.
const UNIT_LABELS: Record<string, string> = {
  kg: 'kg',
  g: 'g',
  ml: 'ml',
  l: 'l',
  none: '',
  cuillere_soupe: 'cuillères à soupe',
  cuillere_cafe: 'cuillères à café',
};

const recipeYield = computed(() => `${recipe.value?.servings || 4} personnes`);

const ingredientLines = computed(() =>
  ingredients.value.map((ingredient) => {
    const qty = ingredient.qty ? `${ingredient.qty} ` : '';
    const unit = UNIT_LABELS[ingredient.unit ?? 'none'] ?? ingredient.unit ?? '';
    return `${qty}${unit ? `${unit} ` : ''}${ingredient.name}`.trim();
  }),
);

const instructionSteps = computed(() =>
  steps.value.map((step) =>
    markdownToPlainText(step.replace(/^\s*\d+[.)]\s*/, "").replace(/[.]$/, "").trim()),
  ),
);

const nutritionSchema = computed(() => ({
  '@type': 'NutritionInformation',
  calories: nutrition.value?.calories,
  carbohydrateContent: nutrition.value?.glucides,
  fatContent: nutrition.value?.lipides,
  proteinContent: nutrition.value?.proteine,
  sugarContent: nutrition.value?.sucre,
  sodiumContent: nutrition.value?.sodium,
}));

// Absolute URL for the Recipe image — the public media key alone produced a
// relative ImageObject url (invalid for GSC). Falls back to the site logo.
const schemaImage = computed(() => {
  const ogPath = formatCoverOgImagePath(coverSource.value) || "/img/logo.webp";
  return useSitePageUrl(ogPath);
});

// Inline Person (explicit @type) — the identity linker otherwise reduces the
// author to a bare `{"@id": …}` reference, which GSC flags as invalid.
const recipeAuthor = computed(() => ({
  "@type": "Person" as const,
  name: SITE_AUTHOR_NAME,
}));

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

const metaDescription = computed(
  () =>
    seo.value?.description ||
    `Recette sur le Journal du cuistot : ${titleContent.value}`,
);

useApplyPageSeo(computed(() => ({
  title: titleContent.value || "Journal du cuistot",
  description: metaDescription.value,
  keywords: seo.value?.keywords,
  image: formatCoverOgImagePath(coverSource.value) || "/img/logo.webp",
  url: pagePath.value,
  author: SITE_AUTHOR_NAME,
  articleDatePublished: recipe.value?.publishedAt,
  articleDateModified: recipe.value?.updatedAt,
  og: {
    headline: titleContent.value,
    description: metaDescription.value,
  },
})));
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
    :dateModified="dateModifiedFormatted" :author="recipeAuthor" :keywords="recipeKeywords"
    :description="metaDescription" :image="schemaImage" :url="pageUrl"
    :recipeYield="recipeYield" :nutrition="nutritionSchema"
    :recipeIngredient="ingredientLines" :recipeInstructions="instructionSteps"
    :recipeCategory="categoryRecipe.name" :recipeCuisine="recipeCuisine"
    :prepTime="recipe?.prepTimeMinutes ? `PT${recipe.prepTimeMinutes}M` : undefined"
    :cookTime="recipe?.cookTimeMinutes ? `PT${recipe.cookTimeMinutes}M` : undefined" />
  <div>
    <h1 itemprop="name" class="block mb-4 font-serif text-5xl font-normal text-black align-baseline">
      {{ titleContent }}
    </h1>
    <Share :date="date" :link="link" />
  </div>
  <SectionHeroArticle :url="urlCover" :alt="cover.alternativeText || titleContent">
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
        {{ recipe?.servings || 4 }} personnes
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
  <RecipeUstensiles :utensils="utensils" />
  <RecipeNutritional :data="formated" />
  <LazyRecipeSteps :steps="steps" />
  <BlockFaqClient v-if="faqItems.length" :items="faqItems">
    <template #title>
      FAQ : vos questions sur cette recette
    </template>
  </BlockFaqClient>
  <LazyCta />
  <LazySectionYouMayAlsoLike :category="categoryRecipe.slug ?? ''" type-content="recipes"
    class="print:hidden" />
</template>
