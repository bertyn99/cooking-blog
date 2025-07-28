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
  console.log(articles[0]);

  for (const doc of pages) {
    feed.item({
      title: doc.title ?? "-",
      url: `https://journalducuistot.fr${generateSlug(
        doc.slug,
        doc.parent
      )}`,
      date: doc.publishedAt,
      description: doc.seoMeta?.description,
    });
  }
  for (const doc of articles) {
    feed.item({
      title: doc.title ?? "-",
      url: `https://journalducuistot.fr/blog/${doc.category?.slug || 'uncategorized'}/${doc.slug}`,
      date: doc.publishedAt,
      description: doc.seoMeta?.description,
    });
  }
  for (const doc of recipes) {
    feed.item({
      title: doc.title ?? "-",
      url: `https://journalducuistot.fr/recette/${doc.slug}`,
      date: doc.publishedAt,
      description: doc.seoMeta?.description,
    });
  }
  const feedString = feed.xml({ indent: true });
  event.node.res.setHeader("content-type", "text/xml");
  event.node.res.end(feedString);
});
