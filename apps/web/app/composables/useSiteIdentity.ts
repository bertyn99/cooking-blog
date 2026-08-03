import type { ComputedRef } from "vue";
import type { SiteIdentity } from "#shared/site-identity";

/** Resolved Schema.org identity from nuxt-site-config (`site.identity`). */
export function useSiteIdentity(): ComputedRef<SiteIdentity | undefined> {
  const site = useSiteConfig({ resolveRefs: true });
  return computed(() => site.identity as SiteIdentity | undefined);
}
