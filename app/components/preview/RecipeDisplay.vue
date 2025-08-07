<script lang="ts" setup>
import type { Category, Cover, Ingredient, Recipe, SEO } from "~/types/strapiMeta";

const { recipe } = defineProps<{
    recipe: Recipe;
}>();

const titleContent = computed(() => recipe?.title || "No title");
const time = computed(() => recipe?.time || "10");
const difficulty = computed(() => recipe?.difficulty || "easy");
const categoryRecipe = computed(() => recipe?.category || ({} as Category));
const intro = computed(() => recipe?.intro || "No intro");
const ingredients = computed(() => recipe?.ingredients || ([] as Ingredient[]));
const cover = computed(() => recipe?.cover || ({} as Cover));
const urlCover = useFormatUrlCover(cover.value);

const recipeNote = computed(() => recipe?.step?.split("\n\n")[1] || []);
const steps = computed(() => recipe?.step?.split("\n\n")[0].split("\n") || []);

const link = computed(() => "https://journalducuistot.fr/recette/" + (recipe?.slug || ""));
const date = computed(() => recipe?.publishedAt || "");
const dateModified = computed(() => recipe?.updatedAt || "");

const dateFormattedDisplay = useDateFormat(date.value.toString(), "YYYY-MM-DD", {
    locales: "en-US",
});
const dateModifiedFormatted = useDateFormat(dateModified.value, "YYYY-MM-DD", {
    locales: "en-US",
});

const nutrition = computed(() => recipe?.nutrition || ({} as any));
const formatedNutrition = computed(() =>
    Object.keys(nutrition.value)
        .filter((elm) => elm !== "id")
        .map((key) => {
            return { name: key, value: nutrition.value[key] };
        })
);
</script>

<template>
    <SchemaOrgBreadcrumb :itemListElement="[
        { name: 'Accueil', item: '/' },
        { name: 'Recettes', item: '/recette' },
        { name: titleContent, item: `/${recipe?.slug}` },
    ]" />
    <SchemaOrgRecipe :name="titleContent" :totalTime="`PT${time}M`" :datePublished="dateFormattedDisplay"
        :dateModified="dateModifiedFormatted" :author="{
            name: 'bertyn boulikou',
            image: 'https://journalducuistot.fr/img/author.jpg',
        }" :keywords="recipe?.seo?.[0]?.keywords" :recipeCuisine="categoryRecipe" />

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
            <p
                class="mx-2 h-6 text-xs leading-6 font-semibold tracking-widest text-black uppercase align-baseline border-0">
                <Icon name="mdi:silverware-fork-knife" class="h-3 w-3 text-gray-500" />
                serves 1
            </p>
            <div
                class="p-0 my-0 mx-2 h-6 text-xs font-semibold tracking-widest text-black uppercase align-baseline border-0">
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
    <RecipeNutritional :data="formatedNutrition" />
    <LazyRecipeSteps :steps="steps" />
    <LazyCta />
    <LazyPrevAndNext class="print:hidden" />
    <LazySectionYouMayAlsoLike :category="categoryRecipe.id || 'cuisine-africaine'" type-content="recipes"
        class="print:hidden" />
</template>
