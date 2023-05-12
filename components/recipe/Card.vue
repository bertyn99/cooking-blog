<script lang="ts" setup>
defineProps({
  recipe: {
    type: Object,
    required: true,
  },
});
</script>

<template>
  <article class="col-span-1 flex flex-col rounded-lg">
    <div class="overflow-hidden rounded-t-lg">
      <img
        src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=4&w=256&h=256&q=60"
        alt=""
        class="w-full object-cover object-center aspect-[3/4]"
      />
    </div>
    <div class="mt-8 flex items-center gap-x-4 text-xs">
      <span class="text-gray-500 uppercase text-">
        {{ recipe.time }} minutes
      </span>
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
        {{ recipe.title }}
      </h3>
      <p class="mt-5 line-clamp-3 text-sm leading-6 text-gray-600">
        {{ recipe.description }}
      </p>
    </div>
  </article>
</template>
