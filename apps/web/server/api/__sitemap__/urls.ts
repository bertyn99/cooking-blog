import { defineSitemapEventHandler } from "#imports";
import type { SitemapUrlInput } from "#sitemap/types";
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

export default defineSitemapEventHandler(async (): Promise<SitemapUrlInput[]> => {
  const [pages, articles, recipes] = await Promise.all([
    serverCmsFindAll<Page>("pages", { populate: ["parent"] }),
    serverCmsFindAll<Article>("articles", { populate: ["category"] }),
    serverCmsFindAll<Recipe>("recipes", { populate: ["cover"] }),
  ]);

  const urls: SitemapUrlInput[] = [
    {
      loc: "/",
      changefreq: "daily",
      priority: 1,
      _sitemap: "pages",
    },
  ];

  for (const doc of pages) {
    const loc = generateSlug(doc.slug ?? "", doc.parent);
    if (SITEMAP_EXCLUDED_PAGE_PATHS.has(loc)) {
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
    urls.push({
      loc: `/blog/${doc.category?.slug || "uncategorized"}/${doc.slug}`,
      lastmod: toSitemapLastmod(doc.updatedAt),
      priority: 0.6,
      changefreq: "daily",
      _sitemap: "blog",
    });
  }

  for (const doc of recipes) {
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
