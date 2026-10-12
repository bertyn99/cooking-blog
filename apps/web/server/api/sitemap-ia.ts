import { generateSlug } from "~/utils/format";
import type { Article, GlossaryTerm, Page, Recipe } from "~/types/strapiMeta";
import { serverCmsFindAll } from "../utils/sitemap-cms";

function isIntentionallyNoindex(robots?: string | null): boolean {
  if (!robots) {
    return false;
  }
  return /\bnoindex\b/i.test(robots);
}

export default defineEventHandler(async () => {
  try {
    const [pages, articles, recipes, glossary] = await Promise.all([
      serverCmsFindAll<Page>("pages", {
        include: ["parent"],
      }),
      serverCmsFindAll<Article>("articles", {
        include: ["category"],
      }),
      serverCmsFindAll<Recipe>("recipes"),
      serverCmsFindAll<GlossaryTerm>("glossary", { include: ["seo"] }),
    ]);

    return {
      pages: [
        "/",
        "/glossaire",
        ...pages
          .filter((doc) => !("isHome" in doc && doc.isHome))
          .map((doc) => generateSlug(doc.slug ?? "", doc.parent)),
      ],
      articles: articles.map(
        (doc) => `/blog/${doc.category?.slug || "uncategorized"}/${doc.slug}`,
      ),
      recipes: recipes.map((doc) => `/recette/${doc.slug}`),
      glossary: glossary
        .filter((doc) => {
          if (!doc.slug?.trim()) return false;
          const seo = Array.isArray(doc.seo) ? doc.seo[0] : doc.seo;
          return !isIntentionallyNoindex(seo?.metaRobots);
        })
        .map((doc) => `/glossaire/${doc.slug}`),
    };
  } catch (error) {
    console.error("Error fetching routes:", error);
    return {
      error: "Failed to fetch routes",
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
});
