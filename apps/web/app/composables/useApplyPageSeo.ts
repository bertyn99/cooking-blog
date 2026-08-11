import type { MetaOption } from "~/types/meta";

export type PageSeoOptions = MetaOption & {
  og?: {
    headline: string;
    description: string;
  };
};

/**
 * Page-level SEO: meta tags (via site config) + optional OG image component.
 * Canonical URLs and default OG/Twitter tags are handled by `@nuxtjs/seo` (nuxt-seo-utils).
 */
export function useApplyPageSeo(options: PageSeoOptions) {
  useApplySeoMeta(options);

  if (options.og) {
    defineOgImage("Cooking", {
      headline: options.og.headline,
      description: options.og.description,
    });
  }
}
