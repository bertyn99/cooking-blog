<script setup lang="ts">
import { Article, Recipe } from "~/types/strapiMeta";

useSeoMeta(
  useLoadMeta({
    title: "Accueil",
    description: "Venez rejoindre la communauté des jeunes cuistots !",
    image: "https://journalducuistot.fr/img/scire_logo_primary.png",
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

const { data: articles } = await find<Article[]>("articles?populate=*");
const { data: recipes } = await find<Recipe>("recipes?populate=cover");
</script>

<template>
  <SectionHero></SectionHero>
  <SectionNewsletter></SectionNewsletter>
  <RecipeList :list="recipes"></RecipeList>
  <SectionRecentArticles :articles="articles"></SectionRecentArticles>
  <SectionFooter></SectionFooter>
</template>
