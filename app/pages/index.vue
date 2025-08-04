<script setup lang="ts">
import type { Article, Recipe } from "~/types/strapiMeta";

useSeoMeta(
  useLoadMeta({
    title: "Accueil",
    description: "Venez rejoindre la communauté des jeunes cuistots !",
    image: "https://journalducuistot.fr/img/logo.png",
    url: "https://journalducuistot.fr",
  }) as any
);
useHead({
  link: [
    {
      rel: "canonical",
      href: "https://journalducuistot.fr",
    },
  ],
});

const { find } = useStrapi();

interface HomepageData {
  articles: { data: Article[]; meta: any };
  recipes: { data: Recipe[]; meta: any };
}

const { data } = await useAsyncData<HomepageData>('homepage-data', async () => {
  const [articlesResponse, recipesResponse] = await Promise.all([
    find<Article>("articles", {
      populate: ["cover", "seo","category"],
      sort: ["publishedAt:desc"],
      pagination: {
        page: 0,
        pageSize: 5,
      },
    }),
    find<Recipe>("recipes", {
      populate: ["cover", "seo"],
      sort: ["publishedAt:desc"],
      pagination: {
        page: 0,
        pageSize: 4,
      },
    })
  ]);

  return {
    articles: articlesResponse.data??[],
    recipes: recipesResponse.data??[]
  };
});

const articles = computed(() => data.value?.articles || []);
const recipes = computed(() => data.value?.recipes || []);

defineOgImageComponent('Cooking', {
  headline:"Accueil",
})

console.log(articles.value);
</script>

<template>
  <SchemaOrgWebPage />
  <SchemaOrgBreadcrumb :itemListElement="[{ name: 'Accueil', item: '/' }]" />
  <SectionHero></SectionHero>
  <SectionNewsletter></SectionNewsletter>
  <LazyRecipeList :list="recipes" :showDetails="true"></LazyRecipeList> 
 <LazySectionRecentArticles :articles="articles"></LazySectionRecentArticles>
</template>
