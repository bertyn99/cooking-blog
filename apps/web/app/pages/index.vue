<script setup lang="ts">
import type { Article, Recipe } from "~/types/strapiMeta";
import type { CmsPage } from "~/types/cms";

const defaultHomeDescription = "Venez rejoindre la communauté des jeunes cuistots !";

const cms = useCms();

const { data: homepage } = await useAsyncData(
  "homepage",
  async () => {
    let page: CmsPage | null = null;
    try {
      const home = await cms.pages({
        isHome: true,
        include: ["seoMeta"],
        page: 1,
        pageSize: 1,
      });
      page = home.data?.[0] ?? null;
    }
    catch {
      page = null;
    }

    const useCmsHome = Boolean(page?.content && page.status === "published");
    if (useCmsHome) {
      return { page, articles: [] as Article[], recipes: [] as Recipe[] };
    }

    const [articlesResponse, recipesResponse] = await Promise.all([
      cms.articles({
        include: ["cover", "category"],
        page: 1,
        pageSize: 5,
      }),
      cms.recipes({
        include: ["cover", "category"],
        page: 1,
        pageSize: 4,
      }),
    ]);

    return {
      page,
      articles: articlesResponse.data ?? [],
      recipes: recipesResponse.data ?? [],
    };
  },
  { deep: false },
);

const homePage = computed(() => homepage.value?.page ?? null);
const useCmsHome = computed(
  () => Boolean(homePage.value?.content && homePage.value.status === "published"),
);
const articles = computed(() => homepage.value?.articles ?? []);
const recipes = computed(() => homepage.value?.recipes ?? []);

const homeDescription = computed(
  () => homePage.value?.seoMeta?.description || defaultHomeDescription,
);
const homeTitle = computed(() => homePage.value?.title || "Accueil");

useApplyPageSeo(computed(() => ({
  title: homeTitle.value,
  description: homeDescription.value,
  image: "/img/logo.png",
  url: "/",
  keywords: homePage.value?.seoMeta?.keywords ?? undefined,
  robots: homePage.value?.seoMeta?.metaRobots ?? undefined,
  og: {
    headline: homeTitle.value,
    description: homeDescription.value,
  },
})));
</script>

<template>
  <SchemaOrgWebPage name="Accueil" :description="homeDescription" />
  <SchemaOrgBreadcrumb :itemListElement="[{ name: 'Accueil', item: '/' }]" />

  <template v-if="useCmsHome && homePage?.content">
    <BasePageBody :content="homePage.content" />
  </template>

  <template v-else>
    <SectionHero />
    <SectionNewsletter />
    <LazyRecipeList :list="recipes" :show-details="true" />
    <LazySectionRecentArticles :articles="articles" />
  </template>
</template>
