import { and, asc, eq, gt, inArray, isNull } from 'drizzle-orm'
import type { AppDb } from '../create-db'
import { articles } from '../schema/articles'
import { recipes } from '../schema/recipes'
import { blobs } from '../schema/blobs'
import { seo } from '../schema/seo'
import { categoryArticles, categories } from '../schema/categories'
import { ingredients } from '../schema/ingredients'
import { recipeUtensils } from '../schema/recipe-utensils'
import { nutrition } from '../schema/nutrition'
import { recipeSteps } from '../schema/recipe-steps'

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
