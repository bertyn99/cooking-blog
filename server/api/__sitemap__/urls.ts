import { defineSitemapEventHandler } from '#imports'
import { generateSlug } from "~/utils/format";

export default defineSitemapEventHandler(async () => {
    // Fetch all documents in parallel
    const [pagesResponse, articlesResponse, recipesResponse] = await Promise.all([
        $fetch("https://admin.journalducuistot.fr/api/pages?populate=parent"),
        $fetch("https://admin.journalducuistot.fr/api/articles?pagination[pageSize]=100"),
        $fetch("https://admin.journalducuistot.fr/api/recipes?pagination[pageSize]=100")
    ]);

    const pages = pagesResponse.data;
    const articles = articlesResponse.data;
    const recipes = recipesResponse.data;

    const urls = [];

    // Add homepage
    urls.push({
        loc: "/",
        changefreq: "daily",
        priority: 1,
    });

    // Add pages
    for (const doc of pages) {
        urls.push({
            loc: generateSlug(doc.attributes.slug, doc.attributes.parent),
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

    // Add articles
    for (const doc of articles) {
        urls.push({
            loc: `/blog/${doc.attributes.slug}`,
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

    // Add recipes
    for (const doc of recipes) {
        urls.push({
            loc: `/recette/${doc.attributes.slug}`,
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

    return urls;
});