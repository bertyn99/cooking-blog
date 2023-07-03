import RSS from "rss";
import { generateSlug } from "~/utils/format";
export default defineEventHandler(async (event) => {
  const feed = new RSS({
    title: "Journal du cuistot",
    site_url: "https://journalducuistot.fr",
    feed_url: `https://journalducuistot.fr/rss.xml`,
  });

  const { data: pages } = await $fetch(
    "https://admin.journalducuistot.fr/api/pages?populate=*"
  );

  const { data: articles } = await $fetch(
    "https://admin.journalducuistot.fr/api/articles?populate=*&publishedAt:desc"
  );

  const { data: recipes } = await $fetch(
    "https://admin.journalducuistot.fr/api/recipes?populate=*&publishedAt:desc"
  );

  for (const doc of pages) {
    feed.item({
      title: doc.attributes.title ?? "-",
      url: `https://journalducuistot.fr${generateSlug(
        doc.attributes.slug,
        doc.attributes.parent
      )}`,
      date: doc.attributes.publishedAt,
      description: doc.attributes?.seoMeta?.description,
    });
  }
  for (const doc of articles) {
    feed.item({
      title: doc.attributes.title ?? "-",
      url: `https://journalducuistot.fr/blog/${doc.attributes.slug}`,
      date: doc.attributes.publishedAt,
      description: doc.attributes?.seo[0]?.description,
    });
  }
  for (const doc of recipes) {
    feed.item({
      title: doc.attributes.title ?? "-",
      url: `https://journalducuistot.fr/recette/${doc.attributes.slug}`,
      date: doc.attributes.publishedAt,
      description: doc.attributes?.seo[0]?.description,
    });
  }
  const feedString = feed.xml({ indent: true });
  event.node.res.setHeader("content-type", "text/xml");
  event.node.res.end(feedString);
});
