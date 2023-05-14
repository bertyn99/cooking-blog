<script setup>
const data = [
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
];
</script>

<template>
  <SectionHero></SectionHero>
  <SectionNewsletter></SectionNewsletter>
  <RecipeList :list="data"></RecipeList>
  <SectionFooter></SectionFooter>
</template>
