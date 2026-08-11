import type { ComputedRef } from "vue";
import type { SiteIdentity } from "#shared/site-identity";

/** Resolved Schema.org identity from runtime config (see `nuxt.config` + `resolveSiteIdentity`). */
export function useSiteIdentity(): ComputedRef<SiteIdentity | undefined> {
  const config = useRuntimeConfig();
  return computed(() => config.site.identity as SiteIdentity | undefined);
}
