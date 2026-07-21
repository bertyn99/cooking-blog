import { eq, sql } from 'drizzle-orm'
import type { AppDb } from '../create-db'
import { schema } from '../create-db'
import { paginateResult } from '../../utils/pagination'
import {
  buildRecipesQueryWhere,
  buildRecipesWith,
  buildRecipeDetailQueryWhere,
  type RecipesQueryOptions,
} from '../../utils/queries/recipes'
import { mergeConditions, applyPublishedScope, localeFilter } from './_shared/filters'
import { recipes } from '../schema/recipes'

export interface RecipeListOptions extends RecipesQueryOptions {
  pagination: { offset: number, limit: number, page: number, pageSize: number }
}

export function createRecipeQueries(db: AppDb) {
  return {
    async listPage(opts: RecipeListOptions) {
      const where = mergeConditions(
        ...applyPublishedScope(recipes, {
          scope: opts.isAuthenticated ? 'admin' : 'public',
        }),
        opts.filters?.slug ? eq(recipes.slug, opts.filters.slug) : undefined,
        opts.filters?.categoryId ? eq(recipes.categoryId, opts.filters.categoryId) : undefined,
        localeFilter(recipes, opts.filters?.locale),
      )

      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(schema.recipes)
        .where(where)
        .all()

      const total = countResult[0]?.count ?? 0
      const rows = await db.query.recipes.findMany({
        where: buildRecipesQueryWhere(opts),
        with: buildRecipesWith(opts.include),
        orderBy: { publishedAt: 'desc' },
        limit: opts.pagination.limit,
        offset: opts.pagination.offset,
      })

      return paginateResult(rows, total, opts.pagination.page, opts.pagination.pageSize)
    },

    findById(id: number, scope: 'public' | 'admin' = 'public', include: string[] = []) {
      const defaultWith = {
        ingredients: true,
        utensils: true,
        nutrition: true,
        reviews: true,
        seo: { with: { socialMeta: true } },
      } as const

      return db.query.recipes.findFirst({
        where: buildRecipeDetailQueryWhere(id, scope === 'admin'),
        with: include.length > 0
          ? buildRecipesWith(include)
          : defaultWith,
      })
    },
  }
}
