/**
 * ads.txt — served only when NUXT_ADSENSE_CLIENT is configured.
 *
 * An empty or placeholder ads.txt is worse than a 404: invalid entries make
 * Google treat ALL inventory as unauthorized. Once AdSense approves the site,
 * set NUXT_ADSENSE_CLIENT (ca-pub-…) in the deploy env and this route serves
 * the correct line automatically.
 *
 * @see seo/roast-roadmap.md — monetization track
 */
import { createError, defineEventHandler, setHeader } from 'h3'

const AUTHORIZED_DIGITAL_SELLERS = 'google.com, pub-%s, DIRECT, f08c47fec0942fa0'

export default defineEventHandler((event) => {
  const client = process.env.NUXT_ADSENSE_CLIENT
  if (!client) {
    throw createError({ statusCode: 404, statusMessage: 'Not Found' })
  }
  const pubId = client.replace(/^ca-/, '')
  setHeader(event, 'content-type', 'text/plain; charset=utf-8')
  return `${AUTHORIZED_DIGITAL_SELLERS.replace('%s', pubId)}\n`
})
