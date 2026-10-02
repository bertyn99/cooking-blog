import RSS from "rss";

import { generateSlug } from "~/utils/format";
import type { Article, Page, Recipe, SEO } from "~/types/strapiMeta";
import { serverCmsFindAll } from "../utils/sitemap-cms";
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

  const [pages, articles, recipes] = await Promise.all([
    serverCmsFindAll<Page>("pages", {
      include: ["parent", "seoMeta"],
    }),
    serverCmsFindAll<Article>("articles", {
      include: ["category", "seo"],
    }),
    serverCmsFindAll<Recipe>("recipes", {
      include: ["cover", "seo"],
    }),
  ]);

  for (const doc of pages) {
    if ("isHome" in doc && doc.isHome) {
      continue;
    }
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
