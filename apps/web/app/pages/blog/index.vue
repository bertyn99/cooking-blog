<script lang="ts" setup>
import type { Article, Category, StrapiResponse } from "~/types/strapiMeta";

const search = ref("");
const checkedCategories = ref<string[]>([]);
const currentPage = ref(1);
const { find } = useStrapi();

const { data: articles, refresh } = await useAsyncData<StrapiResponse<Article>>(
  `articles`,
  () =>
    find<Article>(`articles`, {
      filters: {
        title: { $contains: search.value },
        category: { name: { $in: checkedCategories.value } },
      },
      sort: ["firstPublishedAt:desc"],
      populate: "*",
      pagination: {
        page: currentPage.value,
        pageSize: 7,
      },
    }),
  { watch: [currentPage] },
);

const { data: categories } = await useAsyncData(`categories`, () =>
  find<Category>(`category-articles?fields=name`),
);

const formatCategories = computed(() =>
  categories.value?.data.map((category) => {
    return { name: category.name ?? "", id: category.id ?? 0 };
  }),
);

const searchWithFilter = () => {
  refresh();
};

const goNext = () => {
  if (articles.value && currentPage.value < articles.value.meta.pagination.pageCount + 1) {
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
      { name: 'Blog', item: '/blog' },
    ]"
  />
  <div class="py-28 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <h1 class="text-4xl font-bold tracking-tight">Blog</h1>
  </div>
  <section
    aria-labelledby="products-heading"
    class="mx-auto max-w-7xl px-4 sm:px-6"
  >
    <div class="pb-24 pt-6 grid grid-cols-1 gap-x-8 gap-y-10 lg:grid-cols-4">
      <Filter
        :categories="formatCategories ?? []"
        :searchValue="search"
        @update:search-value="search = $event"
        v-model:selected="checkedCategories"
        @filter="searchWithFilter"
      />
      <div class="lg:col-span-3">
        <ArticleList :articles="articles?.data ?? []"></ArticleList>
        <BasePagination
          :totalPage="articles?.meta.pagination.pageCount ?? 1"
          :currentPage="currentPage"
          :prev="goPrev"
          :next="goNext"
          :to="goTo"
        />
      </div>
    </div>
  </section>
</template>
