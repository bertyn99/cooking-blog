import { canAccessAdminApi } from '../../../../shared/abilities'
import type { StrapiImportConfigResponse } from '../../../../shared/strapi-import'
import { getStrapiImportStatus } from '../../../services/strapi-import-status'
import { getStrapiReachability } from '../../../services/strapi-reachability'
import { getStrapiImportStepCoverage } from '../../../services/strapi-import-coverage'
import { useDb } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  await authorize(event, canAccessAdminApi)

  const config = useRuntimeConfig(event)
  const query = getQuery(event)
  const forceConnection = query.testConnection === 'true'

  const status = await getStrapiImportStatus(event)

  let strapiReachable: boolean | null = null
  let strapiArticleCount: number | undefined
  let reachabilityCheckedAt: string | undefined
  let stepCoverage: StrapiImportConfigResponse['stepCoverage']

  const db = useDb(event)

  if (config.strapiUrl) {
    const reachability = await getStrapiReachability(event, {
      baseUrl: config.strapiUrl,
      token: config.strapiApiToken || undefined,
      force: forceConnection,
    })
    strapiReachable = reachability.reachable
    strapiArticleCount = reachability.totalArticles
    reachabilityCheckedAt = reachability.checkedAt

    stepCoverage = await getStrapiImportStepCoverage(event, db, {
      baseUrl: config.strapiUrl,
      token: config.strapiApiToken || undefined,
      strapiReachable: reachability.reachable,
      force: forceConnection,
    })
  }

  return {
    strapiUrl: config.strapiUrl,
    hasStrapiToken: Boolean(config.strapiApiToken),
    strapiReachable,
    strapiArticleCount,
    reachabilityCheckedAt,
    stepCoverage,
    status,
  } satisfies StrapiImportConfigResponse
})
