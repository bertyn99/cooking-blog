import type { H3Event } from 'h3'
import { useQueries } from '../utils/db'
import {
  AMAZON_AFFILIATE_TAG_KEY,
  normalizeAmazonTag,
  resolveGlossaryAffiliateUrl,
} from '../../shared/glossary-affiliate'

export async function loadAmazonAffiliateTag(event: H3Event): Promise<string | null> {
  const row = await useQueries(event).siteSettings.get(AMAZON_AFFILIATE_TAG_KEY)
  return normalizeAmazonTag(row?.value)
}

export async function resolveTermAffiliateUrl(
  event: H3Event,
  term: { partnerUrl?: string | null, amazonAsin?: string | null },
): Promise<string | null> {
  const amazonTag = await loadAmazonAffiliateTag(event)
  return resolveGlossaryAffiliateUrl({
    partnerUrl: term.partnerUrl,
    amazonAsin: term.amazonAsin,
    amazonTag,
  })
}

export function attachResolvedAffiliate<T extends {
  kind: string
  partnerUrl?: string | null
  amazonAsin?: string | null
}>(term: T, amazonTag: string | null) {
  return {
    ...term,
    resolvedAffiliateUrl: term.kind === 'ustensile'
      ? resolveGlossaryAffiliateUrl({
          partnerUrl: term.partnerUrl,
          amazonAsin: term.amazonAsin,
          amazonTag,
        })
      : null,
  }
}
