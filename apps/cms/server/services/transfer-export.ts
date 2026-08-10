import { and, asc, eq, gt, inArray, isNull } from 'drizzle-orm'
import type { AppDb } from '../db/create-db'
import { articles } from '../db/schema/articles'
import { recipes } from '../db/schema/recipes'
import { blobs } from '../db/schema/blobs'
import { seo } from '../db/schema/seo'
import { categoryArticles, categories } from '../db/schema/categories'
import { ingredients } from '../db/schema/ingredients'
import { recipeUtensils } from '../db/schema/recipe-utensils'
import { nutrition } from '../db/schema/nutrition'
import { recipeSteps } from '../db/schema/recipe-steps'
import { createApiError } from '../utils/errors'

const DEFAULT_LIMIT = 50
const MAX_LIMIT = 200

export function parseTransferPage(query: Record<string, unknown>) {
  const rawLimit = Number.parseInt(String(query.limit ?? DEFAULT_LIMIT), 10)
  const limit = Number.isFinite(rawLimit)
    ? Math.min(MAX_LIMIT, Math.max(1, rawLimit))
    : DEFAULT_LIMIT

  let cursor: number | null = null
  if (typeof query.cursor === 'string' && query.cursor.trim()) {
    const parsed = Number.parseInt(query.cursor, 10)
    if (!Number.isFinite(parsed) || parsed < 0) {
      throw createApiError('VALIDATION_ERROR', 'Curseur invalide.')
    }
    cursor = parsed
  }

  return { limit, cursor }
}

export function parseMediaTransferPage(query: Record<string, unknown>) {
  const rawLimit = Number.parseInt(String(query.limit ?? DEFAULT_LIMIT), 10)
  const limit = Number.isFinite(rawLimit)
    ? Math.min(MAX_LIMIT, Math.max(1, rawLimit))
    : DEFAULT_LIMIT

  const cursor = typeof query.cursor === 'string' && query.cursor.trim()
    ? query.cursor.trim()
    : null

  return { limit, cursor }
}

function nextCursor(ids: number[], limit: number): string | null {
  if (ids.length < limit) return null
  const last = ids[ids.length - 1]
  return last === undefined ? null : String(last)
}

export function createTransferExportQueries(db: AppDb) {
  return {
    async exportArticlesPage(opts: { cursor: number | null, limit: number }) {
      const where = opts.cursor === null
        ? isNull(articles.deletedAt)
        : and(isNull(articles.deletedAt), gt(articles.id, opts.cursor))

      const rows = await db
        .select()
        .from(articles)
        .where(where)
        .orderBy(asc(articles.id))
        .limit(opts.limit)
        .all()

      const ids = rows.map(row => row.id)
      const categoryIds = [...new Set(
        rows.map(row => row.categoryId).filter((id): id is number => id != null),
      )]

      const [seoRows, categoryRows] = await Promise.all([
        ids.length
          ? db.select().from(seo).where(inArray(seo.articleId, ids)).all()
          : Promise.resolve([]),
        categoryIds.length
          ? db.select().from(categoryArticles).where(inArray(categoryArticles.id, categoryIds)).all()
          : Promise.resolve([]),
      ])

      return {
        items: rows,
        related: {
          seo: seoRows,
          categoryArticles: categoryRows,
        },
        nextCursor: nextCursor(ids, opts.limit),
      }
    },

    async exportRecipesPage(opts: { cursor: number | null, limit: number }) {
      const where = opts.cursor === null
        ? isNull(recipes.deletedAt)
        : and(isNull(recipes.deletedAt), gt(recipes.id, opts.cursor))

      const rows = await db
        .select()
        .from(recipes)
        .where(where)
        .orderBy(asc(recipes.id))
        .limit(opts.limit)
        .all()

      const ids = rows.map(row => row.id)
      const categoryIds = [...new Set(
        rows.map(row => row.categoryId).filter((id): id is number => id != null),
      )]

      const [
        seoRows,
        categoryRows,
        ingredientRows,
        utensilRows,
        nutritionRows,
        stepRows,
      ] = await Promise.all([
        ids.length ? db.select().from(seo).where(inArray(seo.recipeId, ids)).all() : [],
        categoryIds.length
          ? db.select().from(categories).where(inArray(categories.id, categoryIds)).all()
          : [],
        ids.length
          ? db.select().from(ingredients).where(inArray(ingredients.recipeId, ids)).all()
          : [],
        ids.length
          ? db.select().from(recipeUtensils).where(inArray(recipeUtensils.recipeId, ids)).all()
          : [],
        ids.length
          ? db.select().from(nutrition).where(inArray(nutrition.recipeId, ids)).all()
          : [],
        ids.length
          ? db.select().from(recipeSteps).where(inArray(recipeSteps.recipeId, ids)).all()
          : [],
      ])

      return {
        items: rows,
        related: {
          seo: seoRows,
          categories: categoryRows,
          ingredients: ingredientRows,
          utensils: utensilRows,
          nutrition: nutritionRows,
          steps: stepRows,
        },
        nextCursor: nextCursor(ids, opts.limit),
      }
    },

    async exportMediaPage(opts: { cursor: string | null, limit: number }) {
      const where = opts.cursor
        ? gt(blobs.pathname, opts.cursor)
        : undefined

      const rows = await db
        .select()
        .from(blobs)
        .where(where)
        .orderBy(asc(blobs.pathname))
        .limit(opts.limit)
        .all()

      const last = rows[rows.length - 1]?.pathname
      return {
        items: rows,
        nextCursor: rows.length < opts.limit || !last ? null : last,
      }
    },

    findBlob(pathname: string) {
      return db.select().from(blobs).where(eq(blobs.pathname, pathname)).get()
    },
  }
}
