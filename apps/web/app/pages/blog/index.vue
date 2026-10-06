<script lang="ts" setup>
import type { Article } from "~/types/strapiMeta";
import type { CmsListResponse } from "~/types/cms";

const PAGE_SIZE = 7;
const blogDescription =
  "Articles, astuces et inspiration culinaire sur le Journal du cuistot.";

useApplyPageSeo({
  title: "Blog",
  description: blogDescription,
  image: "/img/logo.webp",
  url: "/blog",
  og: {
    headline: "Blog",
    description: blogDescription,
  },
});

const route = useRoute();
const cms = useCms();
const search = ref("");
const checkedCategories = ref<string[]>([]);
const appliedSearch = ref("");
const appliedCategories = ref<string[]>([]);
const currentPage = computed(() => parsePageQuery(route.query));

const { data: articles } = await useAsyncData<CmsListResponse<Article>>(
  () => {
    const categories = [...appliedCategories.value].sort().join("|");
    return `articles-p${currentPage.value}-q${appliedSearch.value}-c${categories}`;
  },
  () =>
    cms.articles({
      search: appliedSearch.value || undefined,
      categoryNames: appliedCategories.value.length ? appliedCategories.value : undefined,
      include: ["cover", "category", "seo"],
      page: currentPage.value,
      pageSize: PAGE_SIZE,
    }),
);

const { data: categories } = await useAsyncData(`blog-article-categories`, () =>
  cms.articleCategories({
    page: 1,
    pageSize: 100,
  }),
);

const formatCategories = computed(() =>
  categories.value?.data.map((category) => {
    return { name: category.name ?? "", id: category.id ?? 0 };
  }),
);

const pageCount = computed(() => articles.value?.meta?.pagination?.pageCount ?? 1);

const searchWithFilter = async () => {
  appliedSearch.value = search.value;
  appliedCategories.value = [...checkedCategories.value];
  if (currentPage.value > 1) {
    await navigateTo(listPageLocation(route.path, route.query, 1));
  }
};
</script>

<template>
  <SchemaOrgWebPage name="Blog" :description="blogDescription" />
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
          :totalPage="pageCount"
          :currentPage="currentPage"
        />
      </div>
    </div>
  </section>
</template>
