<script lang="ts" setup>
import type { Article } from "~/types/strapiMeta";

defineProps({
  articles: {
    type: Array as PropType<Article[]>,
    required: true,
  },
});
</script>

<template>
  <section class="mx-auto max-w-7xl px-3 lg:px-12 py-8 md:py-14 lg:py-20">
    <div class="mx-auto max-w-2xl lg:max-w-4xl">
      <h4
        class="flex items-center p-0 m-0 font-serif text-xl font-normal leading-6 text-black align-baseline border-0"
      >
        <!--  <span
          class="hidden p-0 my-0 mr-4 ml-0 w-full h-2 text-xl leading-7 text-black align-baseline border-solid border-x-0 border-y border-stone-200"
        ></span> -->
        <span
          class="w-full max-w-max text-xl leading-7 text-black align-baseline"
          >Derniers Articles</span
        >
        <span
          class="hidden md:block ml-4 w-full h-2 font-semibold tracking-widest text-black uppercase align-baseline border-solid border-x-0 border-y border-stone-200"
          style="
            transform: scaleX(1);
            transform-origin: left center;
            transition: all 0.5s cubic-bezier(0.76, 0.35, 0.32, 0.79) 0s;
          "
        ></span>
      </h4>
      <ArticleList :articles="articles" class="mt-16 lg:mt-20" />
    </div>
  </section>
</template>
