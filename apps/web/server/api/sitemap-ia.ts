import { generateSlug } from "~/utils/format";
import type { Article, Page, Recipe } from "~/types/strapiMeta";
import { serverCmsFindAll } from "../utils/sitemap-cms";

export default defineEventHandler(async () => {
  try {
    const [pages, articles, recipes] = await Promise.all([
      serverCmsFindAll<Page>("pages", {
        include: ["parent"],
      }),
      serverCmsFindAll<Article>("articles", {
        include: ["category"],
      }),
      serverCmsFindAll<Recipe>("recipes"),
    ]);

    return {
      pages: [
        "/",
        ...pages
          .filter((doc) => !("isHome" in doc && doc.isHome))
          .map((doc) => generateSlug(doc.slug ?? "", doc.parent)),
      ],
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
