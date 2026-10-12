export const AMAZON_AFFILIATE_TAG_KEY = 'affiliate.amazon_tag'
export const AMAZON_AFFILIATE_DOMAIN = 'www.amazon.fr'

const ASIN_RE = /^[A-Z0-9]{10}$/
const ASIN_FROM_URL_RE = /\/(?:dp|gp\/product|gp\/aw\/d)\/([A-Z0-9]{10})/i

export function normalizeAmazonTag(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const tag = value.trim()
  return tag || null
}

export function normalizeAmazonAsin(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const asin = value.trim().toUpperCase()
  return ASIN_RE.test(asin) ? asin : null
}

export function extractAmazonAsin(value: string): string | null {
  const direct = normalizeAmazonAsin(value)
  if (direct) return direct
  const match = value.match(ASIN_FROM_URL_RE)
  return match?.[1] ? normalizeAmazonAsin(match[1]) : null
}

export function buildAmazonProductUrl(asin: string, tag: string | null): string {
  const url = `https://${AMAZON_AFFILIATE_DOMAIN}/dp/${asin}`
  return tag ? `${url}?tag=${encodeURIComponent(tag)}` : url
}

export function resolveGlossaryAffiliateUrl(input: {
  partnerUrl?: string | null
  amazonAsin?: string | null
  amazonTag?: string | null
}): string | null {
  const partner = input.partnerUrl?.trim()
  if (partner) return partner

  const asin = normalizeAmazonAsin(input.amazonAsin)
  if (!asin) return null

  return buildAmazonProductUrl(asin, normalizeAmazonTag(input.amazonTag))
}

export function amazonAffiliatePreviewUrl(tag: string | null, exampleAsin = 'B000000000'): string {
  return buildAmazonProductUrl(exampleAsin, tag)
}
