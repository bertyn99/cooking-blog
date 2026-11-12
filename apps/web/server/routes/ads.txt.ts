/**
 * ads.txt — served only when the AdSense client id is configured.
 *
 * An empty or placeholder ads.txt is worse than a 404: invalid entries make
 * Google treat ALL inventory as unauthorized. Once AdSense approves the site,
 * set NUXT_PUBLIC_ADSENSE_CLIENT (ca-pub-…) in the deploy env and this route
 * serves the correct line automatically.
 *
 * @see seo/roast-roadmap.md — monetization track
 */
import { createError, defineEventHandler, setHeader } from 'h3'

export default defineEventHandler((event) => {
  const client = process.env.NUXT_PUBLIC_ADSENSE_CLIENT
  if (!client) {
    throw createError({ statusCode: 404, statusMessage: 'Not Found' })
  }
  // ads.txt wants the bare publisher id: `ca-pub-…` → `pub-…`.
  const pubId = client.replace(/^ca-/, '')
  setHeader(event, 'content-type', 'text/plain; charset=utf-8')
  return `google.com, ${pubId}, DIRECT, f08c47fec0942fa0\n`
})
