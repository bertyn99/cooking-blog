import type { Article } from "~/types/strapiMeta";
import { serverCmsFind } from "../utils/cms-fetch";

/**
 * Legacy `/blog/:slug` → `/blog/:category/:slug`.
 *
 * Must live in middleware, not `server/routes/blog/[slug]`. A Nitro route
 * there also matches Nuxt client payloads (`/blog/_payload.json`) and 404s
 * the Blog index on in-app navigation.
 */
function legacyArticleSlug(pathname: string): string | null {
  const match = pathname.match(/^\/blog\/([^/]+)\/?$/);
  if (!match) return null;

  let slug: string;
  try {
    slug = decodeURIComponent(match[1] ?? "").trim();
  }
  catch {
    return null;
  }
  if (!slug || slug.startsWith("_") || slug.includes(".")) return null;

  return slug;
}

export default defineEventHandler(async (event) => {
  const articleSlug = legacyArticleSlug(getRequestURL(event).pathname);
  if (!articleSlug) return;

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
