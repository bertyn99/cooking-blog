import type { CmsListResponse } from '~/types/cms'
import {
  CMS_FETCH_DEFAULTS,
  cmsCollectionPath,
  toCmsQuery,
  type CmsQuery,
} from '~/utils/cms-query'

let serverCmsFetch: ReturnType<typeof $fetch.create> | undefined

export function getServerCmsBaseUrl(): string {
  try {
    const config = useRuntimeConfig()
    const fromConfig = String(config.public.cmsBaseUrl || '').trim()
    if (fromConfig) return fromConfig.replace(/\/$/, '')
  }
  catch {
    // Sitemap/RSS handlers without a request context.
  }

  return (process.env.NUXT_PUBLIC_CMS_BASE_URL || 'http://localhost:3001').replace(/\/$/, '')
}

export function createServerCmsFetch() {
  if (!serverCmsFetch) {
    serverCmsFetch = $fetch.create({
      ...CMS_FETCH_DEFAULTS,
    })
  }
  return serverCmsFetch
}

export async function serverCmsFind<T>(
  collection: string,
  query: CmsQuery = {},
  headers?: Record<string, string>,
): Promise<CmsListResponse<T>> {
  const cms = createServerCmsFetch()
  return cms<CmsListResponse<T>>(cmsCollectionPath(collection), {
    baseURL: `${getServerCmsBaseUrl()}/api`,
    query: toCmsQuery(query),
    headers,
  })
}
