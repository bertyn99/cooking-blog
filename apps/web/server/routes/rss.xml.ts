import RSS from "rss";

import { generateSlug } from "~/utils/format";
import type { Article, Page, Recipe, SEO, StrapiResponse } from "~/types/strapiMeta";

function getSeoDescription(seo: SEO[] | SEO | undefined, seoMeta?: SEO) {
  if (seoMeta?.description) return seoMeta.description;
  const item = Array.isArray(seo) ? seo[0] : seo;
  return item?.description ?? "";
}

export default defineEventHandler(async (event) => {
  const strapiUrl = process.env.STRAPI_URL || process.env.NUXT_PUBLIC_CMS_BASE_URL || "http://localhost:3001";

  const feed = new RSS({
    title: "Journal du cuistot",
    site_url: "https://journalducuistot.fr",
    feed_url: `https://journalducuistot.fr/rss.xml`,
  });

  const { data: pages } = await $fetch<StrapiResponse<Page>>(
    `${strapiUrl}/api/pages?populate[0]=parent&populate[1]=parent.parent&populate[2]=seoMeta&pagination[pageSize]=100&pagination[page]=1&status=published`,
  );

  const { data: articles } = await $fetch<StrapiResponse<Article>>(
    `${strapiUrl}/api/articles?populate=*&publishedAt:desc`,
  );

  const { data: recipes } = await $fetch<StrapiResponse<Recipe>>(
    `${strapiUrl}/api/recipes?populate=*&publishedAt:desc`,
  );

  for (const doc of pages) {
    feed.item({
      title: doc.title ?? "-",
      url: `https://journalducuistot.fr${generateSlug(doc.slug ?? "", doc.parent)}`,
      date: doc.publishedAt ?? new Date().toISOString(),
      description: getSeoDescription(undefined, doc.seoMeta),
    });
  }
  for (const doc of articles) {
    feed.item({
      title: doc.title ?? "-",
      url: `https://journalducuistot.fr/blog/${doc.category?.slug || "uncategorized"}/${doc.slug}`,
      date: doc.publishedAt ?? new Date().toISOString(),
      description: getSeoDescription(doc.seo, doc.seoMeta),
    });
  }
  for (const doc of recipes) {
    feed.item({
      title: doc.title ?? "-",
      url: `https://journalducuistot.fr/recette/${doc.slug}`,
      date: doc.publishedAt ?? new Date().toISOString(),
      description: getSeoDescription(doc.seo, doc.seoMeta),
    });
  }
  const feedString = feed.xml({ indent: true });
  event.node.res.setHeader("content-type", "text/xml");
  event.node.res.end(feedString);
});
