import { mediaCoverPreviewUrl } from '~/utils/media'
import { usePreviewArticleList, usePreviewRecipeList, type PreviewListItem } from '~/composables/usePreviewBlockList'
import type { ContentBlockListQuery } from '@journalducuistot/shared/content-blocks/list'

function coverSrc(item: PreviewListItem): string | undefined {
  const pathname = item.coverBlobPathname ?? item.cover?.pathname
  if (!pathname) return undefined
  return mediaCoverPreviewUrl(pathname)
}

function readingMinutes(content?: string | null) {
  if (!content?.trim()) return undefined
  return Math.max(1, Math.ceil(content.trim().split(/\s+/).length / 265))
}

export function useContentBlockRecipeList(props: ContentBlockListQuery) {
  const { data, status, error } = usePreviewRecipeList(props)
  const items = computed(() =>
    (data.value ?? []).map(recipe => ({
      id: recipe.id,
      title: recipe.title,
      coverSrc: coverSrc(recipe),
      time: recipe.time ?? undefined,
      difficulty: recipe.difficulty ?? undefined,
    })),
  )
  return { data: items, status, error }
}

export function useContentBlockArticleList(props: ContentBlockListQuery) {
  const { data, status, error } = usePreviewArticleList(props)
  const items = computed(() =>
    (data.value ?? []).map(article => ({
      id: article.id,
      title: article.title,
      coverSrc: coverSrc(article),
      category: article.category?.name,
      description: article.seoMeta?.description,
      readingMinutes: readingMinutes(article.content),
    })),
  )
  return { data: items, status, error }
}
