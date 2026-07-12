import { generateSlug } from "~/utils/format";

export default defineEventHandler(async () => {
    try {
        // Fetch all documents in parallel
        const [pagesResponse, articlesResponse, recipesResponse] = await Promise.all([
            $fetch("https://admin.journalducuistot.fr/api/pages?populate[parent][populate][0]=parent&pagination[pageSize]=100&status=published"),
            $fetch("https://admin.journalducuistot.fr/api/articles?pagination[pageSize]=100&populate=category"),
            $fetch("https://admin.journalducuistot.fr/api/recipes?pagination[pageSize]=100")
        ]) as any[];

        const pages = pagesResponse.data || [];
        const articles = articlesResponse.data || [];
        const recipes = recipesResponse.data || [];

        // Group slugs by type
        const routes = {
            pages: pages.map((doc: any) => generateSlug(doc.slug, doc.parent)),
            articles: articles.map((doc: any) => `/blog/${doc.category?.slug || 'uncategorized'}/${doc.slug}`),
            recipes: recipes.map((doc: any) => `/recette/${doc.slug}`)
        };

        return routes;

    } catch (error) {
        console.error('Error fetching routes:', error);
        return {
            error: 'Failed to fetch routes',
            message: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}); 