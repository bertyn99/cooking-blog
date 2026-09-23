import type { Article, Category, Recipe } from '~/types/strapiMeta'
import type { CmsListResponse, CmsPage } from '~/types/cms'
import {
  cmsCollectionPath,
  toCmsQuery,
  type CmsArticleListQuery,
  type CmsCategoryListQuery,
  type CmsPageListQuery,
  type CmsQuery,
  type CmsRecipeListQuery,
} from '~/utils/cms-query'

/**
 * Typed CMS HTTP client. Query keys match `apps/cms` list GET handlers
 * (`slug`, `slugs`, `isHome`, `include`, `page`, `pageSize`) — not Strapi filters.
 */
export function useCms() {
  const { $cms } = useNuxtApp()

  function list<T>(collection: string, query?: CmsQuery) {
    return $cms<CmsListResponse<T>>(cmsCollectionPath(collection), {
      query: toCmsQuery(query),
    })
  }

  return {
    list,
    pages: (query?: CmsPageListQuery) => list<CmsPage>('pages', query),
    recipes: (query?: CmsRecipeListQuery) => list<Recipe>('recipes', query),
    articles: (query?: CmsArticleListQuery) => list<Article>('articles', query),
    categories: (query?: CmsCategoryListQuery) => list<Category>('categories', query),
    articleCategories: (query?: CmsCategoryListQuery) => list<Category>('category-articles', query),
  }
}
