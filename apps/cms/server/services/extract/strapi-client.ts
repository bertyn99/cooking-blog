export interface StrapiListResponse<T> {
  data: T[]
  meta: {
    pagination: {
      page: number
      pageSize: number
      pageCount: number
      total: number
    }
  }
}

export interface StrapiClientOptions {
  baseUrl: string
  token?: string
}

export function createStrapiClient(opts: StrapiClientOptions) {
  const base = opts.baseUrl.replace(/\/$/, '')

  async function fetchPage<T>(
    collection: string,
    page: number,
    pageSize: number,
    extraQuery?: Record<string, string>,
  ): Promise<StrapiListResponse<T>> {
    const params = new URLSearchParams({
      'pagination[page]': String(page),
      'pagination[pageSize]': String(pageSize),
    })

    const hasExplicitPopulate = extraQuery
      ? Object.keys(extraQuery).some(key => key === 'populate' || key.startsWith('populate['))
      : false

    if (!hasExplicitPopulate) {
      params.set('populate', '*')
    }

    if (extraQuery) {
      for (const [key, value] of Object.entries(extraQuery)) {
        params.set(key, value)
      }
    }

    return $fetch<StrapiListResponse<T>>(`${base}/api/${collection}?${params.toString()}`, {
      headers: opts.token ? { Authorization: `Bearer ${opts.token}` } : undefined,
    })
  }

  async function* listAll<T>(
    collection: string,
    pageSize = 100,
    extraQuery?: Record<string, string>,
  ): AsyncGenerator<T> {
    let page = 1
    while (true) {
      const res = await fetchPage<T>(collection, page, pageSize, extraQuery)
      for (const item of res.data ?? []) {
        yield item
      }
      if (!res.meta?.pagination || page >= res.meta.pagination.pageCount) {
        break
      }
      page += 1
    }
  }

  async function downloadFile(relativeUrl: string): Promise<ArrayBuffer> {
    const path = relativeUrl.startsWith('/') ? relativeUrl : `/${relativeUrl}`
    return $fetch<ArrayBuffer>(`${base}${path}`, {
      responseType: 'arrayBuffer',
      headers: opts.token ? { Authorization: `Bearer ${opts.token}` } : undefined,
    })
  }

  async function ping(): Promise<{ ok: boolean, totalArticles?: number }> {
    const res = await fetchPage<{ id: number }>('articles', 1, 1)
    return { ok: true, totalArticles: res.meta?.pagination?.total }
  }

  async function countCollection(collection: string): Promise<number> {
    const res = await fetchPage<{ id: number }>(collection, 1, 1)
    return res.meta?.pagination?.total ?? 0
  }

  async function findBySlug<T>(
    collection: string,
    slug: string,
    locale: string,
    extraQuery?: Record<string, string>,
  ): Promise<T | null> {
    const res = await fetchPage<T>(collection, 1, 1, {
      'filters[slug][$eq]': slug,
      'filters[locale][$eq]': locale,
      ...extraQuery,
    })
    return res.data?.[0] ?? null
  }

  return { listAll, downloadFile, ping, countCollection, findBySlug }
}
