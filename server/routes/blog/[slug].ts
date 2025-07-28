export default defineEventHandler(async (event) => {
    const { slug } = getRouterParams(event);

    // If slug is an array, join it
    const articleSlug = Array.isArray(slug) ? slug.join('/') : slug;

    // Skip if this is the blog index page
    if (!articleSlug || articleSlug === '') {

        throw createError({
            statusCode: 404,
            statusMessage: 'Page not found'
        });
    }

    try {
        // Fetch the article from Strapi to get its category
        const config = useRuntimeConfig();
        const strapiUrl = config.strapi?.url || 'http://localhost:1337';

        const response = await $fetch(
            `${strapiUrl}/api/articles?filters[slug][$eq]=${articleSlug}&populate=category&pagination[page]=0&pagination[pageSize]=1`
        ) as any;


        if (response.data && response.data.length > 0) {
            const articleData = response?.data[0];
            const category = articleData?.category;
            if (category && category.slug) {
                // Redirect to the new nested structure
                return sendRedirect(event, `/blog/${category.slug}/${articleSlug}`, 301);
            }
        }

        // If no article found or no category, return 404
        throw createError({
            statusCode: 404,
            statusMessage: 'Article not found'
        });

    } catch (error) {
        // If there's an error fetching from Strapi, return 404
        throw createError({
            statusCode: 404,
            statusMessage: 'Article not found'
        });
    }
}); 