import { generateSlug } from "~/utils/format";
import type { Article, Page, Recipe } from "~/types/strapiMeta";
import { serverCmsFind } from "../utils/cms-fetch";

export default defineEventHandler(async () => {
  try {
    const [pagesResponse, articlesResponse, recipesResponse] = await Promise.all([
      serverCmsFind<Page>("pages", {
        populate: ["parent"],
        pagination: { page: 1, pageSize: 100 },
      }),
      serverCmsFind<Article>("articles", {
        populate: ["category"],
        pagination: { page: 1, pageSize: 100 },
      }),
      serverCmsFind<Recipe>("recipes", {
        pagination: { page: 1, pageSize: 100 },
      }),
    ]);

    const pages = pagesResponse.data || [];
    const articles = articlesResponse.data || [];
    const recipes = recipesResponse.data || [];

    return {
      pages: pages.map((doc) => generateSlug(doc.slug ?? "", doc.parent)),
      articles: articles.map(
        (doc) => `/blog/${doc.category?.slug || "uncategorized"}/${doc.slug}`,
      ),
      recipes: recipes.map((doc) => `/recette/${doc.slug}`),
    };
  } catch (error) {
    console.error("Error fetching routes:", error);
    return {
      error: "Failed to fetch routes",
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
});
