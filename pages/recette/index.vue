<script lang="ts" setup>
import { Recipe } from "~/types/strapiMeta";

const { find } = useStrapi();
const search = ref("");
const checkedCategories = ref<string[]>([]);
const { data: recipes, refresh } = await useAsyncData<Recipe>(`recipes`, () =>
  find(`recipes`, {
    filters: {
      title: { $regex: search.value, $options: "i" },
      categories: { name: { $in: checkedCategories.value } },
    },
    sort: ["publishedAt:desc"],
    populate: ["cover", "categories"],
    pagination: {
      page: 0,
      pageSize: 16,
    },
  })
);

const { data: categories } = await useAsyncData(`categories`, () =>
  find(`categories?fields=name`)
);

const formatCategories = computed(() =>
  categories.value?.data.map((category) => {
    return { name: category.attributes?.name, id: category.id };
  })
);
</script>

<template>
  <div class="py-28 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <h1 class="text-4xl font-bold tracking-tight">Recettes</h1>
  </div>
  <section
    aria-labelledby="products-heading"
    class="mx-auto max-w-7xl px-4 sm:px-6"
  >
    <div class="pb-24 pt-6 grid grid-cols-1 gap-x-8 gap-y-10 lg:grid-cols-4">
      <Filter
        v-model:selected="checkedCategories"
        :categories="formatCategories"
        :searchValue="search"
      />
      <div class="lg:col-span-3">
        <RecipeList :list="recipes?.data" />
      </div>
    </div>
  </section>
</template>
