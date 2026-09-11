import { buildCmsListUrl, type CmsFilters } from '~/utils/cms-client'

const PREVIEW_TYPES = ['article', 'page', 'recipe'] as const
type PreviewType = (typeof PREVIEW_TYPES)[number]

function isPreviewType(value: string): value is PreviewType {
  return (PREVIEW_TYPES as readonly string[]).includes(value)
}

function collectionForType(type: PreviewType): string {
  switch (type) {
    case 'article':
      return 'articles'
    case 'page':
      return 'pages'
    case 'recipe':
      return 'recipes'
    default: {
      const _exhaustive: never = type
      return _exhaustive
    }
  }
}

function populateForType(type: PreviewType): string[] {
  switch (type) {
    case 'article':
      return ['cover', 'category', 'seo']
    case 'page':
      return ['content', 'seoMeta', 'parent']
    case 'recipe':
      return ['cover', 'category', 'nutrition', 'ingredients', 'utensils', 'seo']
    default: {
      const _exhaustive: never = type
      return _exhaustive
    }
  }
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const type = String(query.type || '')
  const slug = String(query.slug || '')

  if (!slug || !isPreviewType(type)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid preview query' })
  }

  const slugParts = slug.split('/').filter(Boolean)
  const isNested = slugParts.length > 1
  const first = isNested ? slugParts[0] : null
  const leaf = isNested ? slugParts[slugParts.length - 1]! : slug

  const filters: CmsFilters = { slug: { $eq: leaf } }
  if (type === 'article' && first) {
    filters.category = { slug: { $eq: first } }
  }
  if (type === 'page' && first) {
    filters.parent = { slug: { $eq: first } }
  }

  const config = useRuntimeConfig(event)
  const baseUrl = String(config.public.cmsBaseUrl || config.public.apiBase || 'http://localhost:3001').replace(/\/$/, '')
  const token = String(config.cmsPreviewToken || '').trim()
  const headers: Record<string, string> = {}
  if (token) {
    headers['x-cms-preview-token'] = token
  }

  const url = buildCmsListUrl(baseUrl, collectionForType(type), {
    filters,
    populate: populateForType(type),
    pagination: { page: 1, pageSize: 1 },
  })

  const response = await $fetch<{ data?: unknown[] }>(url, { headers })
  const row = response.data?.[0]
  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Content not found' })
  }

  return { type, data: row }
})
