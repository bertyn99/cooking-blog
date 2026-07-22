import type { Article } from "~/types/strapiMeta";
import { serverCmsFind } from "../../utils/cms-fetch";

export default defineEventHandler(async (event) => {
  const { slug } = getRouterParams(event);

  const articleSlug = Array.isArray(slug) ? slug.join("/") : slug;

  if (!articleSlug || articleSlug === "") {
    throw createError({
      statusCode: 404,
      statusMessage: "Page not found",
    });
  }

  try {
    const response = await serverCmsFind<Article>("articles", {
      filters: { slug: { $eq: articleSlug } },
      populate: ["category"],
      pagination: { page: 1, pageSize: 1 },
    });

    if (response.data && response.data.length > 0) {
      const articleData = response.data[0];
      const category = articleData?.category;
      if (category && category.slug) {
        return sendRedirect(event, `/blog/${category.slug}/${articleSlug}`, 301);
      }
    }

    throw createError({
      statusCode: 404,
      statusMessage: "Article not found",
    });
  } catch {
    throw createError({
      statusCode: 404,
      statusMessage: "Article not found",
    });
  }
});
