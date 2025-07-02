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

const cover = useFormatUrlCover(recipe.cover);
</script>

<template>
  <article class="col-span-1 flex flex-col rounded-lg">
    <div class="overflow-hidden rounded-t-lg">
      <nuxt-img
        provider="localImageSharp"
        :src="cover"
        width="1300"
        height="1657"
        :alt="recipe.cover.alternativeText"
        class="w-full object-cover aspect-[3/4]"
        sizes="sm:55vw md:25vw lg:20vw"
        format="webp"
      />
    </div>
    <div class="mt-8 flex items-center gap-x-4 text-xs" v-if="details">
      <span class="inline-flex items-center uppercase font-medium gap-1">
        <Icon name="ic:sharp-access-time" class="h-3 w-3 text-gray-400" />
        {{ recipe.time }}
        minutes
      </span>
      <!--  <NuxtLink
        to=""
        class="relative z-10 rounded-full bg-gray-50 px-3 py-1.5 font-medium text-gray-600 hover:bg-gray-100"
        >{{ post.category.title }} </NuxtLink
      > -->
      <span class="inline-flex items-center uppercase font-medium gap-1">
        <Icon name="ic:sharp-restaurant" class="h-3 w-3 text-gray-400" />
        {{ recipe.difficulty }}
      </span>
    </div>
    <div class="group">
      <NuxtLink :to="`/recette/${recipe.slug}`">
        <h3
          class="mt-3 text-lg font-semibold leading-6 text-gray-900 group-hover:text-gray-600 capitalize"
        >
          <!--  <span class="absolute inset-0" /> -->
          {{ recipe.title }}
        </h3>
        <!--   <p class="mt-5 line-clamp-3 text-sm leading-6 text-gray-600">
        {{ recipe.description }}
      </p> -->
      </NuxtLink>
    </div>
  </article>
</template>
