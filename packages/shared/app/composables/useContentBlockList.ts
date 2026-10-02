import type { ContentBlockListItem, ContentBlockListQuery } from '../../shared/content-blocks/list'

export type { ContentBlockListItem, ContentBlockListQuery }

export type ContentBlockListResult = {
  data: Ref<ContentBlockListItem[] | null>
  status: Ref<'idle' | 'pending' | 'success' | 'error'>
  error: Ref<unknown>
}

function missingAdapter(kind: 'recipes' | 'articles'): ContentBlockListResult {
  return {
    data: ref(null),
    status: ref('error'),
    error: ref(new Error(`useContentBlock${kind === 'recipes' ? 'Recipe' : 'Article'}List must be provided by the app`)),
  }
}

/**
 * Fallback if an app forgets to provide list adapters.
 * Apps ship `app/composables/useContentBlockList.ts` (auto-imported there).
 * This file is not registered by the module — same names would clash.
 */
export function useContentBlockRecipeList(
  _props: ContentBlockListQuery,
): ContentBlockListResult {
  return missingAdapter('recipes')
}

export function useContentBlockArticleList(
  _props: ContentBlockListQuery,
): ContentBlockListResult {
  return missingAdapter('articles')
}
