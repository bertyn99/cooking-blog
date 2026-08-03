/** Schema.org site identity (consumed by nuxt-schema-org via `site.identity`). */
export type SiteIdentityType = "Organization" | "Person" | "LocalBusiness";

export interface SiteIdentity {
  type: SiteIdentityType;
  name: string;
  url: string;
  logo: string;
  sameAs: string[];
}

const DEFAULT_SITE_NAME = "Journal du cuistot";

const DEFAULT_SAME_AS = ["https://www.pinterest.com/journalducuistot/"];

function parseSameAsEnv(value: string | undefined): string[] | undefined {
  if (!value?.trim()) {
    return undefined;
  }
  const urls = value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
  return urls.length > 0 ? urls : undefined;
}

function parseIdentityType(value: string | undefined): SiteIdentityType | undefined {
  if (value === "Organization" || value === "Person" || value === "LocalBusiness") {
    return value;
  }
  return undefined;
}

/**
 * Build site identity for Schema.org from defaults and env.
 *
 * Env (optional overrides):
 * - `NUXT_SITE_NAME` — also used for `site.name`
 * - `NUXT_SITE_IDENTITY_TYPE` — Organization | Person | LocalBusiness
 * - `NUXT_SITE_IDENTITY_URL` — canonical org/person URL (defaults to site origin)
 * - `NUXT_SITE_IDENTITY_LOGO` — absolute logo URL
 * - `NUXT_SITE_IDENTITY_SAME_AS` — comma-separated profile URLs
 */
export function resolveSiteIdentity(options: {
  siteOrigin: string;
  siteName?: string;
}): SiteIdentity {
  const siteOrigin = options.siteOrigin.replace(/\/$/, "");
  const name = process.env.NUXT_SITE_NAME || options.siteName || DEFAULT_SITE_NAME;
  const type = parseIdentityType(process.env.NUXT_SITE_IDENTITY_TYPE) || "Organization";
  const url = (process.env.NUXT_SITE_IDENTITY_URL || siteOrigin).replace(/\/$/, "");
  const logo =
    process.env.NUXT_SITE_IDENTITY_LOGO || `${siteOrigin}/img/logo.webp`;
  const sameAs = parseSameAsEnv(process.env.NUXT_SITE_IDENTITY_SAME_AS) || [
    ...DEFAULT_SAME_AS,
  ];

  return { type, name, url, logo, sameAs };
}
