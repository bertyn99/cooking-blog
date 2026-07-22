import { eq, and, sql, desc, inArray, or, like } from 'drizzle-orm'
import type { AppDb } from '../create-db'
import { schema } from '../create-db'
import { paginateResult } from '../../utils/pagination'
import {
  buildRecipesWith,
  buildRecipeDetailQueryWhere,
  type RecipesQueryOptions,
} from './_shared/builders/recipes'
import { mergeConditions, applyPublishedScope, localeFilter } from './_shared/filters'
import { reorderByIds } from './_shared/list-page'
import { reserveUniqueSlugInLocale } from './_shared/reserve-slug'
import { recipes } from '../schema/recipes'

export type RecipeUpdatePatch = Partial<Omit<typeof schema.recipes.$inferInsert, 'id' | 'createdAt'>>
export type NutritionRowInput = Omit<typeof schema.nutrition.$inferInsert, 'id' | 'recipeId'>
type IngredientUnit = NonNullable<typeof schema.ingredients.$inferInsert['unit']>

function normalizeIngredientUnit(unit?: string): IngredientUnit {
  const allowed: IngredientUnit[] = ['none', 'g', 'mg', 'kg', 'l', 'ml', 'cuillere_soupe', 'cuillere_cafe', 'tasse']
  if (unit && (allowed as string[]).includes(unit)) {
    return unit as IngredientUnit
  }
  return 'none'
}

export interface RecipeListOptions extends RecipesQueryOptions {
  pagination: { offset: number, limit: number, page: number, pageSize: number }
}

function buildRecipesListSqlWhere(opts: RecipeListOptions) {
  const searchTerm = opts.filters?.search ? `%${opts.filters.search}%` : undefined

  return mergeConditions(
    ...applyPublishedScope(recipes, {
      scope: opts.isAuthenticated ? 'admin' : 'public',
    }),
    opts.filters?.slug ? eq(recipes.slug, opts.filters.slug) : undefined,
    opts.filters?.categoryId ? eq(recipes.categoryId, opts.filters.categoryId) : undefined,
    opts.filters?.categoryIds?.length
      ? inArray(recipes.categoryId, opts.filters.categoryIds)
      : undefined,
    localeFilter(recipes, opts.filters?.locale),
    searchTerm
      ? or(like(recipes.title, searchTerm), like(recipes.slug, searchTerm))
      : undefined,
  )
}

export function createRecipeQueries(db: AppDb) {
  return {
    async listPage(opts: RecipeListOptions) {
      const where = buildRecipesListSqlWhere(opts)

      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(schema.recipes)
        .where(where)
        .all()

      const total = countResult[0]?.count ?? 0

      const idRows = await db
        .select({ id: recipes.id })
        .from(schema.recipes)
        .where(where)
        .orderBy(desc(recipes.publishedAt))
        .limit(opts.pagination.limit)
        .offset(opts.pagination.offset)
        .all()

      const ids = idRows.map(row => row.id)
      if (ids.length === 0) {
        return paginateResult([], total, opts.pagination.page, opts.pagination.pageSize)
      }

      const rows = reorderByIds(
        await db.query.recipes.findMany({
          where: { id: { in: ids } },
          with: buildRecipesWith(opts.include),
        }),
        ids,
      )

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

    findRowById(id: number) {
      return db.select().from(schema.recipes).where(eq(schema.recipes.id, id)).get()
    },

    listSlugsInLocale(locale: string) {
      return db
        .select({ slug: schema.recipes.slug })
        .from(schema.recipes)
        .where(eq(schema.recipes.locale, locale))
        .all()
        .then(rows => rows.map(r => r.slug))
    },

    async reserveUniqueSlug(baseSlug: string, locale: string) {
      return reserveUniqueSlugInLocale(baseSlug, locale, async (slug, loc) => {
        const existing = await db
          .select({ id: schema.recipes.id })
          .from(schema.recipes)
          .where(and(eq(schema.recipes.slug, slug), eq(schema.recipes.locale, loc)))
          .get()
        return existing !== undefined
      })
    },

    insert(values: typeof schema.recipes.$inferInsert) {
      return db.insert(schema.recipes).values(values).returning().get()
    },

    updateById(id: number, updates: RecipeUpdatePatch) {
      return db.update(schema.recipes).set(updates).where(eq(schema.recipes.id, id)).returning().get()
    },

    async updateWithRelations(
      id: number,
      updates: RecipeUpdatePatch,
      relations: {
        ingredients?: Array<{ name: string, qty?: number, unit?: string, sortOrder?: number }>
        utensils?: Array<{ name: string, note?: string | null, affiliateUrl?: string | null, sortOrder?: number }>
        nutrition?: NutritionRowInput | null
      },
    ) {
      return db.transaction(async (tx) => {
        const result = await tx
          .update(schema.recipes)
          .set(updates)
          .where(eq(schema.recipes.id, id))
          .returning()
          .get()

        if (relations.ingredients !== undefined) {
          await tx.delete(schema.ingredients).where(eq(schema.ingredients.recipeId, id))
          if (relations.ingredients.length) {
            await tx.insert(schema.ingredients).values(
              relations.ingredients.map((ing, i) => ({
                recipeId: id,
                name: ing.name,
                qty: ing.qty,
                unit: normalizeIngredientUnit(ing.unit),
                sortOrder: ing.sortOrder ?? i,
              })),
            )
          }
        }

        if (relations.utensils !== undefined) {
          await tx.delete(schema.recipeUtensils).where(eq(schema.recipeUtensils.recipeId, id))
          if (relations.utensils.length) {
            await tx.insert(schema.recipeUtensils).values(
              relations.utensils.map((row, i) => ({
                recipeId: id,
                name: row.name.trim(),
                note: row.note?.trim() || null,
                affiliateUrl: row.affiliateUrl?.trim() || null,
                sortOrder: row.sortOrder ?? i,
              })),
            )
          }
        }

        if (relations.nutrition !== undefined) {
          await tx.delete(schema.nutrition).where(eq(schema.nutrition.recipeId, id))
          if (relations.nutrition && Object.keys(relations.nutrition).length > 0) {
            await tx.insert(schema.nutrition).values({ recipeId: id, ...relations.nutrition })
          }
        }

        return result
      })
    },

    async replaceIngredients(
      recipeId: number,
      ingredients: Array<{ name: string, qty?: number, unit?: string, sortOrder?: number }>,
    ) {
      await db.delete(schema.ingredients).where(eq(schema.ingredients.recipeId, recipeId))
      if (ingredients.length) {
        await db.insert(schema.ingredients).values(
          ingredients.map((ing, i) => ({
            recipeId,
            name: ing.name,
            qty: ing.qty,
            unit: normalizeIngredientUnit(ing.unit),
            sortOrder: ing.sortOrder ?? i,
          })),
        )
      }
    },

    async replaceUtensils(
      recipeId: number,
      utensils: Array<{ name: string, note?: string | null, affiliateUrl?: string | null, sortOrder?: number }>,
    ) {
      await db.delete(schema.recipeUtensils).where(eq(schema.recipeUtensils.recipeId, recipeId))
      if (utensils.length) {
        await db.insert(schema.recipeUtensils).values(
          utensils.map((row, i) => ({
            recipeId,
            name: row.name.trim(),
            note: row.note?.trim() || null,
            affiliateUrl: row.affiliateUrl?.trim() || null,
            sortOrder: row.sortOrder ?? i,
          })),
        )
      }
    },

    async replaceNutrition(recipeId: number, nutritionRow: NutritionRowInput | null | undefined) {
      await db.delete(schema.nutrition).where(eq(schema.nutrition.recipeId, recipeId))
      if (nutritionRow && Object.keys(nutritionRow).length > 0) {
        await db.insert(schema.nutrition).values({ recipeId, ...nutritionRow })
      }
    },

    softDelete(id: number) {
      return db
        .update(schema.recipes)
        .set({ deletedAt: new Date().toISOString() })
        .where(eq(schema.recipes.id, id))
    },
  }
}
