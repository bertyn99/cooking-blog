<script setup lang="ts">
import { Article, Recipe } from "~/types/strapiMeta";

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

const { data: articles } = await find<Article>("articles", {
  populate: ["cover", "seo"],
  sort: ["publishedAt:desc"],
  pagination: {
    page: 0,
    pageSize: 5,
  },
});
const { data: recipes } = await find<Recipe>("recipes", {
  populate: ["cover", "seo"],
  sort: ["publishedAt:desc"],
  pagination: {
    page: 0,
    pageSize: 4,
  },
});
</script>

<template>
  <SchemaOrgWebPage />
  <SchemaOrgBreadcrumb :itemListElement="[{ name: 'Accueil', item: '/' }]" />
  <SectionHero></SectionHero>
  <SectionNewsletter></SectionNewsletter>
  <RecipeList :list="recipes" :showDetails="true"></RecipeList>
  <SectionRecentArticles :articles="articles"></SectionRecentArticles>
</template>
