import { SitemapStream, streamToPromise } from "sitemap";
export default defineEventHandler(async (event: any) => {
  const generateSlug = (str: string, parent: any) => {
    return parent?.data?.attributes?.slug
      ? `/${parent?.data?.attributes?.slug}/${str}`
      : `/${str}`;
  };
  // Fetch all documents
  const { data: pages } = await $fetch(
    "https://admin.journalducuistot.fr/api/pages?populate=parent"
  );

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

  for (const doc of pages) {
    sitemap.write({
      url: generateSlug(doc.attributes.slug, doc.attributes.parent),
      lastmod: doc.attributes.updatedAt,
      priority: 0.8,
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

  for (const doc of articles) {
    sitemap.write({
      url: `blog/${doc.attributes.slug}`,
      lastmod: doc.attributes.updatedAt,
      priority: 0.6,
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
      lastmod: doc.attributes.updatedAt,
      priority: 0.7,
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
