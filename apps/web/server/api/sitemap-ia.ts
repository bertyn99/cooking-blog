import { generateSlug } from "~/utils/format";
import type { Article, Page, Recipe, StrapiResponse } from "~/types/strapiMeta";

export default defineEventHandler(async () => {
  try {
    const strapiUrl = process.env.STRAPI_URL || process.env.NUXT_PUBLIC_CMS_BASE_URL || "http://localhost:3001";

    const [pagesResponse, articlesResponse, recipesResponse] = await Promise.all([
      $fetch<StrapiResponse<Page>>(
        `${strapiUrl}/api/pages?populate[parent][populate][0]=parent&pagination[pageSize]=100&status=published`,
      ),
      $fetch<StrapiResponse<Article>>(
        `${strapiUrl}/api/articles?pagination[pageSize]=100&populate=category`,
      ),
      $fetch<StrapiResponse<Recipe>>(`${strapiUrl}/api/recipes?pagination[pageSize]=100`),
    ]);

    const pages = pagesResponse.data || [];
    const articles = articlesResponse.data || [];
    const recipes = recipesResponse.data || [];

    const routes = {
      pages: pages.map((doc) => generateSlug(doc.slug ?? "", doc.parent)),
      articles: articles.map(
        (doc) => `/blog/${doc.category?.slug || "uncategorized"}/${doc.slug}`,
      ),
      recipes: recipes.map((doc) => `/recette/${doc.slug}`),
    };

    return routes;
  } catch (error) {
    console.error("Error fetching routes:", error);
    return {
      error: "Failed to fetch routes",
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
});
