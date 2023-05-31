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

const { data: articles } = await find<Article[]>(
  "articles?fields[0]=title&populate=*"
);
const { data: recipes } = await find<Recipe>("recipes?populate=cover");
console.log(articles);
/* const data = [
  {
    title: "test",
    id: 1,
    description: "test",
    image: "test",
    time: 60,
    difficulty: "easy",
  },
  {
    title: "test1",
    id: 1,
    description: "test",
    image: "test",
    time: 30,
    difficulty: "easy",
  },
  {
    title: "test2",
    id: 1,
    description: "test",
    image: "test",
    time: 40,
    difficulty: "easy",
  },
  {
    title: "test2",
    id: 1,
    description: "test",
    image: "test",
    time: 20,
    difficulty: "easy",
  },
]; */
</script>

<template>
  <SectionHero></SectionHero>
  <SectionNewsletter></SectionNewsletter>
  <!--   <RecipeList :list="recipes"></RecipeList> -->
  <ArticleList :articles="articles"></ArticleList>
  <SectionFooter></SectionFooter>
</template>
