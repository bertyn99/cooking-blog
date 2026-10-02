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

  let response;
  try {
    response = await serverCmsFind<Article>("articles", {
      slug: articleSlug,
      include: ["category"],
      page: 1,
      pageSize: 1,
    });
  } catch (error) {
    const statusCode
      = typeof error === "object" && error && "statusCode" in error
        ? Number((error as { statusCode: number }).statusCode)
        : 500;
    if (statusCode === 404) {
      throw createError({
        statusCode: 404,
        statusMessage: "Article not found",
      });
    }
    throw error;
  }

  if (response.data && response.data.length > 0) {
    const articleData = response.data[0];
    const categorySlug = articleData?.category?.slug?.trim() || "uncategorized";
    return sendRedirect(event, `/blog/${categorySlug}/${articleSlug}`, 301);
  }

  throw createError({
    statusCode: 404,
    statusMessage: "Article not found",
  });
});
