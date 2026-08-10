export { SITE_AUTHOR_NAME } from "#shared/site-identity";

export function siteUrlOrigin(siteUrl: string): string {
  return siteUrl.replace(/\/$/, "");
}

/** Absolute URL for a path on the configured site origin. */
export function absoluteSiteUrl(siteUrl: string, path: string): string {
  const base = siteUrlOrigin(siteUrl);
  if (!path) {
    return `${base}/`;
  }
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export function useSitePageUrl(path: string): string {
  const site = useSiteConfig();
  return absoluteSiteUrl(site.url, path);
}

/** @deprecated Prefer automatic canonical URLs from `@nuxtjs/seo` (nuxt-seo-utils). */
export function usePageCanonical(path: string): string {
  const href = useSitePageUrl(path);
  useHead({
    link: [{ rel: "canonical", href }],
  });
  return href;
}
