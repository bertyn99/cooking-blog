<script setup lang="ts">
import { Article, Recipe } from "~/types/strapiMeta";

const { find } = useStrapi();

const { data: articles } = await find<Article[]>(
  "articles?fields[0]=title&populate=cover"
);
const { data: recipes } = await find<Recipe>("recipes?populate=cover");

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
  <RecipeList :list="recipes"></RecipeList>
  <ArticleList :list="articles"></ArticleList>
  <SectionFooter></SectionFooter>
</template>
