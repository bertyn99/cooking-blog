<script lang="ts" setup>
import type { Recipe } from "~/types/strapiMeta";
import type { CmsListResponse } from "~/types/cms";

definePageMeta({
  key: (route) => route.fullPath,
});

const PAGE_SIZE = 16;
const cms = useCms();
const route = useRoute();
const search = ref("");
const checkedCategories = ref<string[]>([]);
const appliedSearch = ref("");
const appliedCategories = ref<string[]>([]);
const currentPage = computed(() => parsePageQuery(route.query));

const recetteDescription =
  "Découvrez nos délicieuses recettes de cuisine, des entrées aux desserts, pour tous les goûts et toutes les occasions.";

useApplyPageSeo({
  title: "Recettes",
  description: recetteDescription,
  image: "/img/logo.webp",
  url: "/recette",
  keywords: "recettes, cuisine, gastronomie, plats, desserts, entrées",
  author: SITE_AUTHOR_NAME,
  og: {
    headline: "Recettes",
    description: recetteDescription,
  },
});

const { data: recipes } = await useAsyncData<CmsListResponse<Recipe>>(
  () => {
    const categories = [...appliedCategories.value].sort().join("|");
    return `recipes-p${currentPage.value}-q${appliedSearch.value}-c${categories}`;
  },
  () =>
    cms.recipes({
      search: appliedSearch.value || undefined,
      categoryNames: appliedCategories.value.length ? appliedCategories.value : undefined,
      include: ["cover", "category"],
      page: currentPage.value,
      pageSize: PAGE_SIZE,
    }),
);

const { data: categories } = await useAsyncData(`recipe-categories`, () =>
  cms.categories({
    page: 1,
    pageSize: 100,
  }),
);

const formatCategories = computed(() =>
  categories.value?.data.map((category) => {
    return { name: category.name ?? "", id: category.id ?? 0 };
  }),
);

const pageCount = computed(() => recipes.value?.meta?.pagination?.pageCount ?? 1);

const searchWithFilter = async () => {
  appliedSearch.value = search.value;
  appliedCategories.value = [...checkedCategories.value];
  if (currentPage.value > 1) {
    await navigateTo(listPageLocation(route.path, route.query, 1));
  }
};
</script>

<template>
  <SchemaOrgBreadcrumb :itemListElement="[
    { name: 'Accueil', item: '/' },
    { name: 'Recette', item: '/recette' },
  ]" />
  <div class="py-28 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <h1 class="text-4xl font-bold tracking-tight">Recettes</h1>
  </div>
  <section aria-labelledby="products-heading" class="mx-auto max-w-7xl px-4 sm:px-6">
    <div class="pb-24 pt-6 grid grid-cols-1 gap-x-8 gap-y-10 lg:grid-cols-4">
      <Filter :categories="formatCategories ?? []" :searchValue="search" @update:search-value="search = $event"
        v-model:selected="checkedCategories" @filter="searchWithFilter" />
      <div class="lg:col-span-3">
        <RecipeList :list="recipes?.data ?? []" showDetails />
        <BasePagination :totalPage="pageCount" :currentPage="currentPage" />
      </div>
    </div>
  </section>
</template>
