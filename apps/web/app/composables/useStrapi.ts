/**
 * Strapi-compatible adapter for the Nuxt CMS layer.
 * Provides a `find()` method compatible with `useStrapi()` API,
 * translating Strapi query patterns to the layer's REST API.
 *
 * File named `useStrapi.ts` for Nuxt auto-import compatibility —
 * drop-in replacement for `@nuxtjs/strapi` module.
 */
import { useRuntimeConfig } from '#imports'

import type { StrapiResponse } from '~/types/strapiMeta'

export type { StrapiResponse }

type FilterValue =
  | string
  | { $eq?: string; $contains?: string; $in?: string[] }
  | { slug?: { $eq?: string }; name?: { $in?: string[] } }

export type StrapiFilters = Record<string, FilterValue>

interface FindOptions {
  populate?: string | string[] | Record<string, unknown>
  filters?: Record<string, FilterValue>
  sort?: string[]
  pagination?: { page?: number; pageSize?: number }
}

interface CmsListResponse<T> {
  data?: T[]
  meta?: StrapiResponse<T>['meta']
}

export function useStrapi() {
  const config = useRuntimeConfig()
  const baseUrl = config.public?.cmsBaseUrl || config.public?.apiBase || 'http://localhost:3001'

  /**
   * Translates Strapi-style populate to the layer's `include` param.
   * Supports: `"*"`, `["cover", "category"]`, and object notation.
   */
  function translatePopulate(populate: FindOptions['populate']): string | undefined {
    if (!populate) return undefined
    if (populate === '*') return '*'
    if (Array.isArray(populate)) return populate.join(',')
    if (typeof populate === 'object') {
      return Object.keys(populate).join(',')
    }
    return undefined
  }

  /**
   * Translates Strapi-style filters to query params.
   * Handles {$eq}, nested filters, and simple values.
   */
  function translateFilters(filters: Record<string, FilterValue>): Record<string, string> {
    const params: Record<string, string> = {}
    for (const [key, value] of Object.entries(filters)) {
      if (value && typeof value === 'object' && '$eq' in value) {
        params[key] = String(value.$eq)
      } else if (value && typeof value === 'object' && 'slug' in value && value.slug?.$eq) {
        params[key] = String(value.slug.$eq)
      } else if (typeof value === 'string') {
        params[key] = value
      }
    }
    return params
  }

  async function find<T>(contentType: string, opts: FindOptions = {}): Promise<StrapiResponse<T>> {
    const params = new URLSearchParams()

    const include = translatePopulate(opts.populate)
    if (include) params.set('include', include)

    const filterParams = translateFilters(opts.filters || {})
    for (const [key, value] of Object.entries(filterParams)) {
      params.set(key, value)
    }

    if (opts.sort?.length) {
      params.set('sort', opts.sort[0]!.replace(':desc', ''))
    }

    params.set('status', 'published')
    if (opts.pagination?.page) params.set('page', String(opts.pagination.page))
    if (opts.pagination?.pageSize) params.set('pageSize', String(opts.pagination.pageSize))

    const url = `${baseUrl}/api/${contentType}?${params.toString()}`
    const response = await $fetch<CmsListResponse<T> | T[]>(url)

    if (!Array.isArray(response) && response.data && response.meta) {
      return response as StrapiResponse<T>
    }

    return {
      data: Array.isArray(response) ? response : (response.data || []),
      meta: (!Array.isArray(response) && response.meta) || {
        pagination: { page: 1, pageSize: 10, pageCount: 1, total: 1 },
      },
    }
  }

  return { find }
}
