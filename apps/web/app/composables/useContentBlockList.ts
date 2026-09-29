import { formatCoverUrlFromSource } from '~/composables/useFormatCover'
import type { ContentBlockListQuery } from '@journalducuistot/shared/content-blocks/list'

function readingMinutes(content?: string | null) {
  if (!content?.trim()) return undefined
  return Math.max(1, Math.ceil(content.trim().split(/\s+/).length / 265))
}

function seoDescription(seo: unknown): string | undefined {
  const item = Array.isArray(seo) ? seo[0] : seo
  if (!item || typeof item !== 'object') return undefined
  const description = (item as { description?: string }).description
  return description?.trim() || undefined
}

export function useContentBlockRecipeList(props: ContentBlockListQuery) {
  const { data, status, error } = useBlockRecipeList(props)
  const items = computed(() =>
    (data.value ?? []).map(recipe => ({
      id: recipe.id,
      title: recipe.title ?? '',
      href: recipe.slug ? `/recette/${recipe.slug}` : undefined,
      coverSrc: formatCoverUrlFromSource(recipe) || undefined,
      time: recipe.time,
      difficulty: recipe.difficulty,
    })),
  )
  return { data: items, status, error }
}

export function useContentBlockArticleList(props: ContentBlockListQuery) {
  const { data, status, error } = useBlockArticleList(props)
  const items = computed(() =>
    (data.value ?? []).map(article => ({
      id: article.id,
      title: article.title ?? '',
      href: article.slug && article.category?.slug
        ? `/blog/${article.category.slug}/${article.slug}`
        : article.slug
          ? `/blog/${article.slug}`
          : undefined,
      coverSrc: formatCoverUrlFromSource(article) || undefined,
      category: article.category?.name,
      description: seoDescription(article.seo ?? article.seoMeta),
      readingMinutes: readingMinutes(article.content),
    })),
  )
  return { data: items, status, error }
}
