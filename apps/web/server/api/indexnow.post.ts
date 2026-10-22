import { createError, defineEventHandler, readBody } from 'nuxt/server'
/**
 * IndexNow submission relay.
 *
 * IndexNow requires the key file to be hosted on the target origin, so the CMS
 * (which knows when content is published) pings this endpoint instead of the
 * search engines directly. The key is public by design — it only proves origin
 * ownership; the literal must match `public/5d05adc8e8d311830f7d607883c347ac.txt`.
 *
 * POST { url: string } | { urls: string[] } — same-origin absolute URLs only.
 * @see https://www.indexnow.org/documentation
 * @see YGG-193
 */
const INDEXNOW_KEY = "5d05adc8e8d311830f7d607883c347ac";
const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";
const MAX_URLS = 1000;

function siteOrigin(): URL | null {
  const raw = process.env.NUXT_PUBLIC_SITE_URL;
  if (!raw) return null;
  try {
    return new URL(raw);
  }
  catch {
    return null;
  }
}

export default defineEventHandler(async (event) => {
  const origin = siteOrigin();
  if (!origin || origin.protocol !== "https:") {
    throw createError({ statusCode: 503, statusMessage: "IndexNow not configured" });
  }

  const body = await readBody<{ url?: unknown, urls?: unknown }>(event).catch(() => null);
  const candidates = [
    ...(Array.isArray(body?.urls) ? body.urls : []),
    ...(typeof body?.url === "string" ? [body.url] : []),
  ].filter((value): value is string => typeof value === "string");

  const urlList = [...new Set(candidates)]
    .filter((candidate) => {
      try {
        const parsed = new URL(candidate);
        return parsed.protocol === "https:" && parsed.hostname === origin.hostname;
      }
      catch {
        return false;
      }
    })
    .slice(0, MAX_URLS);

  if (urlList.length === 0) {
    throw createError({ statusCode: 400, statusMessage: "No valid same-origin URLs" });
  }

  const response = await $fetch.raw(INDEXNOW_ENDPOINT, {
    method: "POST",
    body: {
      host: origin.hostname,
      key: INDEXNOW_KEY,
      keyLocation: `${origin.origin}/${INDEXNOW_KEY}.txt`,
      urlList,
    },
    timeout: 10000,
  });

  return { submitted: urlList.length, status: response.status };
});
