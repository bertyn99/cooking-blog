import type { AppDb } from './create-db'

type HubQuery = NonNullable<AppDb['query']>

export type ArticlesQueryFilter = NonNullable<Parameters<HubQuery['articles']['findMany']>[0]>['where']
export type ArticlesWith = NonNullable<Parameters<HubQuery['articles']['findMany']>[0]>['with']

export type RecipesQueryFilter = NonNullable<Parameters<HubQuery['recipes']['findMany']>[0]>['where']
export type RecipesWith = NonNullable<Parameters<HubQuery['recipes']['findMany']>[0]>['with']

export type PagesQueryFilter = NonNullable<Parameters<HubQuery['pages']['findMany']>[0]>['where']
export type PagesWith = NonNullable<Parameters<HubQuery['pages']['findMany']>[0]>['with']

export type SeoQueryFilter = NonNullable<Parameters<HubQuery['seo']['findFirst']>[0]>['where']
