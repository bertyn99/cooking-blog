import { absolutePublicUrl } from '#shared/public-site-paths'
import { useRuntimeConfig } from 'nuxt/server'

/**
 * Fire-and-forget IndexNow ping through the public site's relay endpoint
 * (`POST /api/indexnow`). The web app owns the key file and forwards to
 * api.indexnow.org — the CMS only needs the site origin.
 *
 * Best-effort by contract: never throws, never blocks publishing. Prod only
 * (https origin) — local dev has no search-engine reach anyway.
 * @see YGG-193
 */
export async function pingIndexNow(paths: string[]): Promise<void> {
  if (paths.length === 0) {
    return
  }

  const config = useRuntimeConfig()
  const siteUrl = (config.public?.siteUrl ?? '').replace(/\/$/, '')
  if (!siteUrl.startsWith('https://')) {
    return
  }

  try {
    await $fetch(`${siteUrl}/api/indexnow`, {
      method: 'POST',
      body: {
        urls: paths.map(path => absolutePublicUrl(siteUrl, path)),
      },
      timeout: 5000,
    })
  }
  catch {
    // Discovery pings are opportunistic — swallow transport/HTTP errors.
  }
}
