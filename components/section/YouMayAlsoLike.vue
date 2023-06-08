<script lang="ts" setup>
import { Category } from "~/types/strapiMeta";

const { categorie, typeContent } = defineProps({
  categorie: {
    type: String,
    required: true,
  },
  typeContent: {
    type: String,
    required: true,
  },
});
const { find } = useStrapi();
const {
  data: content,
  pending,
  refresh,
  error,
} = await useAsyncData<Category>(`recipe-you-may-like`, () =>
  find(
    `${typeContent}?filters[categories][name][$eq]=${categorie}&populate=cover&pagination[pageSize]=3`
  )
);
</script>

<template>
  <section class="my-6">
    <div class="mb-6">
      <h4
        class="flex items-center p-0 m-0 font-serif text-2xl font-normal leading-6 text-black align-baseline break-words border-0"
        style="outline: 0px; background-position: 0px center"
      >
        <span class="w-full max-w-max leading-7 text-black align-baseline"
          >Vous pouvez aussi aimer</span
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
    </div>
    <RecipeList :list="content?.data" />
  </section>
</template>
