import RSS from "rss";
export default defineEventHandler(async (event) => {
  const feed = new RSS({
    title: "Journal du cuistot",
    site_url: "https://journalducuistot.fr",
    feed_url: `https://journalducuistot.fr/rss.xml`,
  });

  const { data: articles } = await $fetch(
    "https://admin.journalducuistot.fr/api/articles?publishedAt:desc"
  );

  const { data: recipes } = await $fetch(
    "https://admin.journalducuistot.fr/api/recipes?publishedAt:desc"
  );

  for (const doc of articles) {
    feed.item({
      title: doc.attributes.title ?? "-",
      url: `https://journalducuistot.fr/blog/${doc.attributes.slug}`,
      date: doc.publishedAt,
      description: doc.attributes.title,
    });
  }
  for (const doc of recipes) {
    feed.item({
      title: doc.attributes.title ?? "-",
      url: `https://journalducuistot.fr/recette/${doc.attributes.slug}`,
      date: doc.publishedAt,
      description: doc.attributes.title,
    });
  }
  const feedString = feed.xml({ indent: true });
  event.node.res.setHeader("content-type", "text/xml");
  event.node.res.end(feedString);
});
