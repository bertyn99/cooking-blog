<script setup>
const data = [
  { title: "test", id: 1, description: "test", image: "test", time: 60 },
  { title: "test1", id: 1, description: "test", image: "test", time: 30 },
  { title: "test2", id: 1, description: "test", image: "test", time: 40 },
];
</script>

<template>
  <SectionHero></SectionHero>
  <SectionNewsletter></SectionNewsletter>
  <RecipeList :list="data"></RecipeList>
  <SectionFooter></SectionFooter>
</template>
