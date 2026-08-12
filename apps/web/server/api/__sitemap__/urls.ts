import { defineSitemapEventHandler } from "#imports";
import type { SitemapUrlInput } from "#sitemap/types";
import { articlePublicPath } from "~/utils/article-path";
import { generateSlug } from "~/utils/format";
import { SITEMAP_EXCLUDED_PAGE_PATHS } from "~/utils/redirect";
import type { Article, Page, Recipe } from "~/types/strapiMeta";
import { serverCmsFindAll } from "../../utils/sitemap-cms";

function toSitemapLastmod(value?: string | null): string | undefined {
  if (!value) {
    return undefined;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }
  return date.toISOString();
}

function isIntentionallyNoindex(robots?: string | null): boolean {
  if (!robots) {
    return false;
  }
  return /\bnoindex\b/i.test(robots);
}

export default defineSitemapEventHandler(async (): Promise<SitemapUrlInput[]> => {
  const [pages, articles, recipes] = await Promise.all([
    serverCmsFindAll<Page>("pages", { populate: ["parent", "seoMeta"] }),
    serverCmsFindAll<Article>("articles", { populate: ["category", "seo"] }),
    serverCmsFindAll<Recipe>("recipes", { populate: ["cover", "seo"] }),
  ]);

  const urls: SitemapUrlInput[] = [
    {
      loc: "/",
      changefreq: "daily",
      priority: 1,
      _sitemap: "pages",
    },
    {
      loc: "/blog",
      changefreq: "daily",
      priority: 0.8,
      _sitemap: "blog",
    },
    {
      loc: "/recette",
      changefreq: "daily",
      priority: 0.8,
      _sitemap: "recipes",
    },
  ];

  for (const doc of pages) {
    if (!doc.slug?.trim()) {
      continue;
    }
    const loc = generateSlug(doc.slug, doc.parent);
    if (loc === "/" || SITEMAP_EXCLUDED_PAGE_PATHS.has(loc)) {
      continue;
    }
    if (isIntentionallyNoindex(doc.seoMeta?.metaRobots)) {
      continue;
    }
    urls.push({
      loc,
      lastmod: toSitemapLastmod(doc.updatedAt),
      priority: 0.8,
      changefreq: "daily",
      _sitemap: "pages",
    });
  }

  for (const doc of articles) {
    if (!doc.slug?.trim()) {
      continue;
    }
    const seo = Array.isArray(doc.seo) ? doc.seo[0] : doc.seo;
    if (isIntentionallyNoindex(seo?.metaRobots ?? doc.seoMeta?.metaRobots)) {
      continue;
    }
    urls.push({
      loc: articlePublicPath(doc.slug, doc.category?.slug),
      lastmod: toSitemapLastmod(doc.updatedAt),
      priority: 0.6,
      changefreq: "daily",
      _sitemap: "blog",
    });
  }

  for (const doc of recipes) {
    if (!doc.slug?.trim()) {
      continue;
    }
    const seo = Array.isArray(doc.seo) ? doc.seo[0] : doc.seo;
    if (isIntentionallyNoindex(seo?.metaRobots ?? doc.seoMeta?.metaRobots)) {
      continue;
    }
    urls.push({
      loc: `/recette/${doc.slug}`,
      lastmod: toSitemapLastmod(doc.updatedAt),
      priority: 0.7,
      changefreq: "daily",
      _sitemap: "recipes",
    });
  }

  return urls;
});
