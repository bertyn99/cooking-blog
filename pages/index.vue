<script setup lang="ts">
const { find } = useStrapi();

const { data: articles } = await find(
  "articles?fields[0]=title&populate=cover"
);
const { data: recipes } = await find("recipes?populate=cover");
console.log(recipes);

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
  <SectionFooter></SectionFooter>
</template>
