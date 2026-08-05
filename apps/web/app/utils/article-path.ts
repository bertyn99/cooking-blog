const FALLBACK_ARTICLE_CATEGORY = "uncategorized";

/** Public blog URL for an article (`/blog/:category/:slug`). */
export function articlePublicPath(
  articleSlug: string,
  categorySlug?: string | null,
): string {
  const slug = articleSlug.trim();
  const category = categorySlug?.trim() || FALLBACK_ARTICLE_CATEGORY;
  return `/blog/${category}/${slug}`;
}

export { FALLBACK_ARTICLE_CATEGORY };
