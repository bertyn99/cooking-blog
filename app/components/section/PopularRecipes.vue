<template>
  <div class="py-24 sm:py-32">
    <div class="mx-auto max-w-7xl px-6 lg:px-8">
      <div class="mx-auto max-w-2xl text-center">
        <h2 class="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          {{ blok.headline }}
        </h2>
        <p class="mt-2 text-lg leading-8 text-gray-600">
          Lorem, dolor sit amet adipisicing elit. Explicabo sed, quisquam
          tempore.
        </p>
      </div>

      <div
        class="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-x-8 gap-y-20 md:grid-cols-2 lg:mx-0 lg:max-w-none lg:grid-cols-4"
      >
        <RecipeCard
          v-for="article in blok.articles"
          :key="article.uuid"
          :article="article.content"
          :slug="article.full_slug"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({ blok: Object });
</script>
