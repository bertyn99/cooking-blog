import { serverCmsFind } from '../utils/cms-fetch'

const PREVIEW_TYPES = ['article', 'page', 'recipe'] as const
type PreviewType = (typeof PREVIEW_TYPES)[number]

function isPreviewType(value: string): value is PreviewType {
  return (PREVIEW_TYPES as readonly string[]).includes(value)
}

function includeForType(type: PreviewType): string[] {
  switch (type) {
    case 'article':
      return ['cover', 'category', 'seo']
    case 'page':
      return ['seoMeta', 'parent']
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
  const leaf = isNested ? slugParts[slugParts.length - 1]! : slug
  const parentSlug = isNested ? slugParts[slugParts.length - 2] : undefined
  const categorySlug = isNested ? slugParts[0] : undefined

  const config = useRuntimeConfig(event)
  const token = String(config.cmsPreviewToken || '').trim()
  const headers: Record<string, string> = {}
  if (token) {
    headers['x-cms-preview-token'] = token
  }

  const collection = type === 'article' ? 'articles' : type === 'page' ? 'pages' : 'recipes'
  const response = await serverCmsFind(collection, {
    slug: leaf,
    ...(type === 'article' && categorySlug ? { categorySlug } : {}),
    ...(type === 'page' && parentSlug ? { parentSlug } : {}),
    include: includeForType(type),
    page: 1,
    pageSize: 1,
  }, headers)

  const row = response.data?.[0]
  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Content not found' })
  }

  return { type, data: row }
})
