import { defineSitemapEventHandler } from "#sitemap/server/composables/defineSitemapEventHandler";
import type { SitemapUrlInput } from "#sitemap/types";
import { generateSlug } from "~/utils/format";
import type { Article, Page, Recipe, StrapiResponse } from "~/types/strapiMeta";

export default defineSitemapEventHandler(async (): Promise<SitemapUrlInput[]> => {
  const strapiUrl = process.env.STRAPI_URL || process.env.NUXT_PUBLIC_CMS_BASE_URL || "http://localhost:3001";

  const [pagesResponse, articlesResponse, recipesResponse] = await Promise.all([
    $fetch<StrapiResponse<Page>>(
      `${strapiUrl}/api/pages?populate[parent][populate][0]=parent&pagination[pageSize]=100&status=published&sort[0]=publishedAt:desc`,
    ),
    $fetch<StrapiResponse<Article>>(
      `${strapiUrl}/api/articles?pagination[pageSize]=100&populate=category&sort[0]=firstPublishedAt:desc`,
    ),
    $fetch<StrapiResponse<Recipe>>(
      `${strapiUrl}/api/recipes?pagination[pageSize]=100&status=published&sort[0]=firstPublishedAt:desc`,
    ),
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
