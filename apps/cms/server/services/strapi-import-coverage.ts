import type { H3Event } from 'h3'
import type { DbQueries } from '../db/queries'
import {
  STRAPI_IMPORT_STEPS,
  type StrapiImportStep,
  type StrapiStepCoverage,
  type StrapiStepSyncState,
} from '../../shared/strapi-import'
import { createStrapiClient } from './extract/strapi-client'
import { useKvStore } from '../utils/kv'

const COVERAGE_KEY = 'strapi-import:coverage'
const COVERAGE_TTL = 120
const COVERAGE_MAX_AGE_MS = 60_000

export async function invalidateStrapiImportCoverage(event?: H3Event) {
  await useKvStore(event).del(COVERAGE_KEY)
}

const STRAPI_COLLECTION: Record<StrapiImportStep, string> = {
  'category-articles': 'category-articles',
  'categories': 'categories',
  'articles': 'articles',
  'recipes': 'recipes',
  'pages': 'pages',
}

export type StrapiStepCoverageMap = Record<StrapiImportStep, StrapiStepCoverage>

function resolveSyncState(mappedCount: number, strapiTotal: number | null): StrapiStepSyncState {
  if (strapiTotal == null) {
    return mappedCount > 0 ? 'unknown' : 'empty'
  }
  if (strapiTotal === 0) return 'empty'
  if (mappedCount === 0) return 'empty'
  if (mappedCount >= strapiTotal) return 'synced'
  return 'partial'
}

export async function buildStrapiStepCoverage(
  queries: DbQueries,
  opts: { baseUrl: string, token?: string, strapiReachable: boolean },
): Promise<StrapiStepCoverageMap> {
  const mappedCounts = await Promise.all(
    STRAPI_IMPORT_STEPS.map(async step => ({
      step,
      mappedCount: await queries.legacyStrapiMap.countBySourceType(step),
    })),
  )

  let strapiTotals: Partial<Record<StrapiImportStep, number>> = {}
  if (opts.strapiReachable && opts.baseUrl) {
    const client = createStrapiClient({ baseUrl: opts.baseUrl, token: opts.token })
    const totals = await Promise.all(
      STRAPI_IMPORT_STEPS.map(async (step) => {
        try {
          const total = await client.countCollection(STRAPI_COLLECTION[step])
          return [step, total] as const
        }
        catch {
          return [step, null] as const
        }
      }),
    )
    strapiTotals = Object.fromEntries(totals.filter(([, t]) => t != null)) as Partial<
      Record<StrapiImportStep, number>
    >
  }

  const result = {} as StrapiStepCoverageMap
  for (const { step, mappedCount } of mappedCounts) {
    const strapiTotal = strapiTotals[step] ?? null
    result[step] = {
      step,
      mappedCount,
      strapiTotal,
      state: resolveSyncState(mappedCount, strapiTotal),
    }
  }
  return result
}

export async function getStrapiImportStepCoverage(
  event: H3Event | undefined,
  queries: DbQueries,
  opts: { baseUrl: string, token?: string, strapiReachable: boolean, force?: boolean },
): Promise<StrapiStepCoverageMap> {
  const store = useKvStore(event)

  if (!opts.force) {
    const cached = await store.get<{ checkedAt: string, steps: StrapiStepCoverageMap }>(COVERAGE_KEY)
    if (cached && Date.now() - new Date(cached.checkedAt).getTime() < COVERAGE_MAX_AGE_MS) {
      return cached.steps
    }
  }

  const steps = await buildStrapiStepCoverage(queries, opts)
  await store.set(COVERAGE_KEY, { checkedAt: new Date().toISOString(), steps }, { ttl: COVERAGE_TTL })
  return steps
}
