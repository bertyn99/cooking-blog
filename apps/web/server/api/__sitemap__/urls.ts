import { defineSitemapEventHandler } from "#sitemap/server/composables/defineSitemapEventHandler";
import type { SitemapUrlInput } from "#sitemap/types";
import { generateSlug } from "~/utils/format";
import type { Article, Page, Recipe } from "~/types/strapiMeta";
import { serverCmsFind } from "../../utils/cms-fetch";

export default defineSitemapEventHandler(async (): Promise<SitemapUrlInput[]> => {
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
      populate: ["cover"],
      pagination: { page: 1, pageSize: 100 },
    }),
  ]);

  const pages = pagesResponse.data;
  const articles = articlesResponse.data;
  const recipes = recipesResponse.data;

  const urls = [];

  urls.push({
    loc: "/",
    changefreq: "daily",
    priority: 1,
  });

  for (const doc of pages) {
    urls.push({
      loc: generateSlug(doc.slug ?? "", doc.parent),
      lastmod: doc.updatedAt,
      priority: 0.8,
      changefreq: "daily",
      _sitemap: "pages",
    });
  }

  for (const doc of articles) {
    urls.push({
      loc: `/blog/${doc.category?.slug || "uncategorized"}/${doc.slug}`,
      lastmod: doc.updatedAt,
      priority: 0.6,
      changefreq: "daily",
      _sitemap: "blog",
    });
  }

  for (const doc of recipes) {
    urls.push({
      loc: `/recette/${doc.slug}`,
      lastmod: doc.updatedAt,
      priority: 0.7,
      changefreq: "daily",
      _sitemap: "recipes",
    });
  }

  return urls as SitemapUrlInput[];
});
