<template>
  <NuxtLink :to="'/' + slug" v-editable="article">
    <article class="flex flex-col items-start justify-between">
      <div class="relative w-full overflow-hidden">
        <img
          :src="article.cover?.filename + '/m/800x0'"
          :alt="article.cover?.alt"
          class="aspect-[3/4] w-full rounded-2xl bg-gray-100 object-cover"
        />
        <div
          class="absolute inset-0 rounded-2xl ring-1 ring-inset ring-gray-900/10"
        />
      </div>
      <div class="max-w-xl">
        <div class="mt-8 flex items-center gap-x-4 text-xs">
          <time :datetime="article.date" class="text-gray-500">{{
            article.date
          }}</time>
          <NuxtLink
            to=""
            class="relative z-10 rounded-full bg-gray-50 px-3 py-1.5 font-medium text-gray-600 hover:bg-gray-100"
            ><!-- {{ post.category.title }} --></NuxtLink
          >
        </div>
        <div class="group relative">
          <h3
            class="mt-3 text-lg font-semibold leading-6 text-gray-900 group-hover:text-gray-600"
          >
            <span class="absolute inset-0" />
            {{ article.title }}
          </h3>
          <p class="mt-5 line-clamp-3 text-sm leading-6 text-gray-600">
            {{ article.description }}
          </p>
        </div>
      </div>
    </article>
  </NuxtLink>
</template>

<script setup>
defineProps({ article: Object, slug: String });
</script>
