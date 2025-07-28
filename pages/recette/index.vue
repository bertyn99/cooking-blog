<script lang="ts" setup>
import type { Recipe } from "~/types/strapiMeta";

const { find } = useStrapi();
const search = ref("");
const checkedCategories = ref<string[]>([]);
const currentPage = ref(1);
const { data: recipes, refresh } = await useAsyncData<Recipe>(
  `recipes`,
  () =>
    find(`recipes`, {
      filters: {
        title: { $contains: search.value },
        categories: { name: { $in: checkedCategories.value } },
      },
      sort: ["firstPublishedAt:desc"],
      populate: ["cover", "category"],
      pagination: {
        page: currentPage.value,
        pageSize: 16,
      },
    }),
  { watch: [currentPage] }
);
defineOgImageComponent('Cooking', {
  headline:"Recettes",
  description: "Découvrez nos délicieuses recettes de cuisine, des entrées aux desserts, pour tous les goûts et toutes les occasions.",
})
useSeoMeta(
  {
    title:"Recettes",
    description: "Découvrez nos délicieuses recettes de cuisine, des entrées aux desserts, pour tous les goûts et toutes les occasions.",
    keywords: "recettes, cuisine, gastronomie, plats, desserts, entrées",

    url: "https://journalducuistot.fr/recette",
    author: "bertyn",
  }
);
useHead({
  link: [
    {
      rel: "canonical",
      href: "https://journalducuistot.fr/recette/recette"
    },
  ],
});

const searchWithFilter = () => {
  refresh();
};
const { data: categories } = await useAsyncData(`categories`, () =>
  find(`categories?fields=name`)
);

const formatCategories = computed(() =>
  categories.value?.data.map((category: any) => {
    return { name: category.name, id: category.id };
  })
);

const goNext = () => {
  if (currentPage.value < recipes.value.meta.pagination.pageCount + 1) {
    currentPage.value += 1;
  }
};

const goPrev = () => {
  if (currentPage.value > 1) currentPage.value -= 1;
};
const goTo = (id: number) => {
  currentPage.value = id;
};
</script>

<template>
  <SchemaOrgBreadcrumb
    :itemListElement="[
      { name: 'Accueil', item: '/' },
      { name: 'Recette', item: '/recette' },
    ]"
  />
  <div class="py-28 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <h1 class="text-4xl font-bold tracking-tight">Recettes</h1>
  </div>
  <section
    aria-labelledby="products-heading"
    class="mx-auto max-w-7xl px-4 sm:px-6"
  >
    <div class="pb-24 pt-6 grid grid-cols-1 gap-x-8 gap-y-10 lg:grid-cols-4">
      <Filter
        :categories="formatCategories"
        :searchValue="search"
        @update:search-value="search = $event"
        v-model:selected="checkedCategories"
        @filter="searchWithFilter"
      />
      <div class="lg:col-span-3">
        <RecipeList :list="recipes?.data" showDetails />
        <BasePagination
          :totalPage="recipes.meta.pagination.pageCount"
          :currentPage="currentPage"
          :prev="goPrev"
          :next="goNext"
          :to="goTo"
        />
      </div>
    </div>
  </section>
</template>
