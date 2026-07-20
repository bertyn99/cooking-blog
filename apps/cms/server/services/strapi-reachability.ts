import type { H3Event } from 'h3'
import type { StrapiReachabilityCache } from '../../shared/strapi-import'
import { createStrapiClient } from './extract/strapi-client'
import { useKvStore } from '../utils/kv'

const REACHABILITY_KEY = 'strapi-import:reachability'
const REACHABILITY_TTL = 120
const REACHABILITY_MAX_AGE_MS = 60_000

export async function getStrapiReachability(
  event: H3Event | undefined,
  opts: { baseUrl: string, token?: string, force?: boolean },
): Promise<StrapiReachabilityCache> {
  const store = useKvStore(event)

  if (!opts.force) {
    const cached = await store.get<StrapiReachabilityCache>(REACHABILITY_KEY)
    if (cached && Date.now() - new Date(cached.checkedAt).getTime() < REACHABILITY_MAX_AGE_MS) {
      return cached
    }
  }

  try {
    const ping = await createStrapiClient({
      baseUrl: opts.baseUrl,
      token: opts.token,
    }).ping()
    const entry: StrapiReachabilityCache = {
      reachable: ping.ok,
      totalArticles: ping.totalArticles,
      checkedAt: new Date().toISOString(),
    }
    await store.set(REACHABILITY_KEY, entry, { ttl: REACHABILITY_TTL })
    return entry
  }
  catch {
    const entry: StrapiReachabilityCache = {
      reachable: false,
      checkedAt: new Date().toISOString(),
    }
    await store.set(REACHABILITY_KEY, entry, { ttl: REACHABILITY_TTL })
    return entry
  }
}
