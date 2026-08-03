<script setup lang="ts">
import type { Article, Recipe } from "~/types/strapiMeta";

const homeDescription = "Venez rejoindre la communauté des jeunes cuistots !";

useApplySeoMeta({
  title: "Accueil",
  description: homeDescription,
  image: "/img/logo.png",
  url: "/",
});
usePageCanonical("/");

const { find } = useCms();

interface HomepageData {
  articles: Article[];
  recipes: Recipe[];
}

const { data } = await useAsyncData<HomepageData>("homepage-data", async () => {
  const [articlesResponse, recipesResponse] = await Promise.all([
    find<Article>("articles", {
      populate: "*",
      sort: ["publishedAt:desc"],
      pagination: {
        page: 1,
        pageSize: 5,
      },
    }),
    find<Recipe>("recipes", {
      populate: "*",
      sort: ["publishedAt:desc"],
      pagination: {
        page: 1,
        pageSize: 4,
      },
    }),
  ]);

  return {
    articles: articlesResponse.data ?? [],
    recipes: recipesResponse.data ?? [],
  };
});

const articles = computed(() => data.value?.articles || []);
const recipes = computed(() => data.value?.recipes || []);

defineOgImage("Cooking", {
  headline: "Accueil",
  description: homeDescription,
});
</script>

<template>
  <SchemaOrgWebPage name="Accueil" :description="homeDescription" />
  <SchemaOrgBreadcrumb :itemListElement="[{ name: 'Accueil', item: '/' }]" />
  <SectionHero></SectionHero>
  <SectionNewsletter></SectionNewsletter>
  <LazyRecipeList :list="recipes" :showDetails="true"></LazyRecipeList>
  <LazySectionRecentArticles :articles="articles"></LazySectionRecentArticles>
</template>
