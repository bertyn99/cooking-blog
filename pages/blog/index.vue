<script lang="ts" setup>
import { Recipe } from "~/types/strapiMeta";

const { find } = useStrapi();

const { data: articles } = await useAsyncData<Recipe>(`articles`, () =>
  find(`articles?populate=*`)
);
console.log(articles);

const { data: categories } = await useAsyncData(`categories`, () =>
  find(`categories?fields=name`)
);

const formatCategories = computed(() =>
  categories.value?.data.map((category) => {
    return { name: category.attributes?.name, id: category.id };
  })
);

const checkedCategories = ref([]);
console.log(formatCategories);
</script>

<template>
  <div class="py-24 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <h1 class="text-4xl font-bold tracking-tight">Recettes</h1>
  </div>
  <section
    aria-labelledby="products-heading"
    class="mx-auto max-w-7xl px-4 sm:px-6"
  >
    <div class="pb-24 pt-6">
      <Filter :categories="formatCategories" :value="checkedCategories" />
      <div class="lg:col-span-3">
        <ArticleList :articles="articles.data"></ArticleList>
      </div>
    </div>
  </section>
</template>
