import type { PaginatedResponse } from '~/types/cms'
import { mediaPublicUrl } from '~/utils/media'

const LIST_LIMIT_CAP = 24

export type PreviewListItem = {
  id: number
  title: string
  slug: string
  coverBlobPathname?: string | null
}

function parseLimit(raw: string | number | undefined, fallback: number): number {
  const n = Number(raw)
  if (!Number.isFinite(n) || n <= 0) return fallback
  return Math.min(Math.trunc(n), LIST_LIMIT_CAP)
}

function listQuery(source: string | undefined, category?: string, slugs?: string) {
  if (source === 'category' && category) {
    return { categorySlug: category }
  }
  if (source === 'slugs' && slugs) {
    return { slugs }
  }
  return {}
}

export function previewCoverSrc(pathname: string | null | undefined): string {
  if (!pathname) return ''
  return mediaPublicUrl(pathname)
}

export function usePreviewRecipeList(props: {
  source?: string
  category?: string
  slugs?: string
  limit?: string | number
}) {
  const { $api } = useNuxtApp()
  const limit = computed(() => parseLimit(props.limit, 4))

  return useAsyncData(
    () => `preview:recipe-list:${props.source ?? 'latest'}:${props.category ?? ''}:${props.slugs ?? ''}:${limit.value}`,
    async () => {
      const result = await $api<PaginatedResponse<PreviewListItem>>('/api/recipes', {
        query: {
          ...listQuery(props.source, props.category, props.slugs),
          include: 'cover',
          page: 1,
          pageSize: limit.value,
        },
      })
      return result.data ?? []
    },
    {
      watch: [
        () => props.source,
        () => props.category,
        () => props.slugs,
        () => props.limit,
      ],
    },
  )
}

export function usePreviewArticleList(props: {
  source?: string
  category?: string
  slugs?: string
  limit?: string | number
}) {
  const { $api } = useNuxtApp()
  const limit = computed(() => parseLimit(props.limit, 5))

  return useAsyncData(
    () => `preview:article-list:${props.source ?? 'latest'}:${props.category ?? ''}:${props.slugs ?? ''}:${limit.value}`,
    async () => {
      const result = await $api<PaginatedResponse<PreviewListItem>>('/api/articles', {
        query: {
          ...listQuery(props.source, props.category, props.slugs),
          include: 'cover',
          page: 1,
          pageSize: limit.value,
        },
      })
      return result.data ?? []
    },
    {
      watch: [
        () => props.source,
        () => props.category,
        () => props.slugs,
        () => props.limit,
      ],
    },
  )
}
