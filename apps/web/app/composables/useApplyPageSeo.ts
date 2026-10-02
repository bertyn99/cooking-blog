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
export function useApplyPageSeo(options: MaybeRefOrGetter<PageSeoOptions>) {
  const seoOptions = computed(() => {
    const value = toValue(options)
    const { og: _og, ...meta } = value
    return meta
  })

  useApplySeoMeta(seoOptions)

  const og = computed(() => toValue(options).og)
  if (og.value) {
    defineOgImage("Cooking", {
      headline: computed(() => toValue(options).og?.headline ?? ""),
      description: computed(() => toValue(options).og?.description ?? ""),
    })
  }
}
