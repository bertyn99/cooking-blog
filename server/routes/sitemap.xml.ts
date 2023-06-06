import { SitemapStream, streamToPromise } from "sitemap";

export default defineEventHandler(async (event: any) => {
  // Fetch all documents

  const { data: articles } = await $fetch(
    "https://admin.journalducuistot.fr/api/articles"
  );

  const { data: recipes } = await $fetch(
    "https://admin.journalducuistot.fr/api/recipes"
  );
  const sitemap = new SitemapStream({
    hostname: "https://journalducuistot.fr",
  });

  sitemap.write({
    url: "/",
    changefreq: "daily",
    priority: 1,
  });
  for (const doc of articles) {
    sitemap.write({
      url: `blog/${doc.attributes.slug}`,
      lastmod: doc.updatedAt,
      changefreq: "daily",
      /* img: [
        {
          url: doc.image,
          caption: doc.description,
          title: doc.title,
        },
      ], */
    });
  }

  for (const doc of recipes) {
    sitemap.write({
      url: `recette/${doc.attributes.slug}`,
      lastmod: doc.updatedAt,
      changefreq: "daily",
      /* img: [
        {
          url: doc.image,
          caption: doc.description,
          title: doc.title,
        },
      ], */
    });
  }

  sitemap.end();
  return streamToPromise(sitemap);
});
