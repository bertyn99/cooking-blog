<script lang="ts" setup>
const { recipe, details } = defineProps({
  recipe: {
    type: Object,
    required: true,
  },
  details: {
    type: Boolean,
    required: false,
    default: false,
  },
});

const cover = useFormatUrlCover(recipe.attributes?.cover, "small");
</script>

<template>
  <article class="col-span-1 flex flex-col rounded-lg">
    <div class="overflow-hidden rounded-t-lg">
      <img :src="cover" alt="" class="w-full object-cover aspect-[3/4]" />
    </div>
    <div class="mt-8 flex items-center gap-x-4 text-xs" v-if="details">
      <span class="inline-flex items-center uppercase font-medium gap-1">
        <Icon name="ic:sharp-access-time" class="h-3 w-3 text-gray-400" />
        {{ recipe.attributes.time }}
        minutes
      </span>
      <!--  <NuxtLink
        to=""
        class="relative z-10 rounded-full bg-gray-50 px-3 py-1.5 font-medium text-gray-600 hover:bg-gray-100"
        >{{ post.category.title }} </NuxtLink
      > -->
      <span class="inline-flex items-center uppercase font-medium gap-1">
        <Icon name="ic:sharp-restaurant" class="h-3 w-3 text-gray-400" />
        {{ recipe.attributes.difficulty }}
      </span>
    </div>
    <div class="group">
      <NuxtLink :to="`recette/${recipe.attributes.slug}`">
        <h3
          class="mt-3 text-lg font-semibold leading-6 text-gray-900 group-hover:text-gray-600 capitalize"
        >
          <!--  <span class="absolute inset-0" /> -->
          {{ recipe.attributes.title }}
        </h3>
        <!--   <p class="mt-5 line-clamp-3 text-sm leading-6 text-gray-600">
        {{ recipe.attributes.description }}
      </p> -->
      </NuxtLink>
    </div>
  </article>
</template>
