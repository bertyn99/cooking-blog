import RSS from "rss";

import { generateSlug } from "~/utils/format";
import type { Article, Page, Recipe, SEO } from "~/types/strapiMeta";
import { serverCmsFind } from "../utils/cms-fetch";
import { getPublicSiteOrigin } from "../utils/site-url";

function getSeoDescription(seo: SEO[] | SEO | undefined, seoMeta?: SEO) {
  if (seoMeta?.description) return seoMeta.description;
  const item = Array.isArray(seo) ? seo[0] : seo;
  return item?.description ?? "";
}

export default defineEventHandler(async (event) => {
  const siteOrigin = getPublicSiteOrigin(event);
  const feed = new RSS({
    title: "Journal du cuistot",
    site_url: siteOrigin,
    feed_url: `${siteOrigin}/rss.xml`,
  });

  const [pagesResponse, articlesResponse, recipesResponse] = await Promise.all([
    serverCmsFind<Page>("pages", {
      populate: ["parent", "seoMeta"],
      pagination: { page: 1, pageSize: 100 },
    }),
    serverCmsFind<Article>("articles", {
      populate: "*",
      pagination: { page: 1, pageSize: 100 },
    }),
    serverCmsFind<Recipe>("recipes", {
      populate: "*",
      pagination: { page: 1, pageSize: 100 },
    }),
  ]);

  const pages = pagesResponse.data;
  const articles = articlesResponse.data;
  const recipes = recipesResponse.data;

  for (const doc of pages) {
    feed.item({
      title: doc.title ?? "-",
      url: `${siteOrigin}${generateSlug(doc.slug ?? "", doc.parent)}`,
      date: doc.publishedAt ?? new Date().toISOString(),
      description: getSeoDescription(undefined, doc.seoMeta),
    });
  }
  for (const doc of articles) {
    feed.item({
      title: doc.title ?? "-",
      url: `${siteOrigin}/blog/${doc.category?.slug || "uncategorized"}/${doc.slug}`,
      date: doc.publishedAt ?? new Date().toISOString(),
      description: getSeoDescription(doc.seo, doc.seoMeta),
    });
  }
  for (const doc of recipes) {
    feed.item({
      title: doc.title ?? "-",
      url: `${siteOrigin}/recette/${doc.slug}`,
      date: doc.publishedAt ?? new Date().toISOString(),
      description: getSeoDescription(doc.seo, doc.seoMeta),
    });
  }

  setHeader(event, "content-type", "text/xml");
  return feed.xml({ indent: true });
});
