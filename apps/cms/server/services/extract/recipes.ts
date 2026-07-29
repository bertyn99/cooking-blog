import { eq } from 'drizzle-orm'
import type { ExtractContext, StrapiEntityStats, StrapiMediaFile, StrapiSeoFields } from './types'
import { strapiSourceId } from './types'
import { createStrapiClient } from './strapi-client'
import { iterateStrapiRows } from './strapi-iterate'
import { importStrapiMedia } from './media'
import { rewriteStrapiUploadsInText } from './content-media'
import { upsertContentSeo } from './seo'
import { bumpImportStats, dryRunOutcome, shallowFieldsEqual, stableJson } from './import-row'
import { schema } from '../../db/create-db'

interface StrapiIngredient {
  id?: number
  name?: string
  qty?: number
  unit?: string
}

interface StrapiReview {
  id?: number
  star?: number
  content?: string
  authorName?: string
}

interface StrapiNutrition {
  lipides?: string
  proteine?: string
  sucre?: string
  calories?: string
  glucides?: string
  sodium?: string
}

interface StrapiRecipe {
  id: number
  documentId?: string
  title: string
  intro?: string | null
  step?: string | null
  slug: string
  difficulty?: 'easy' | 'medium' | 'hard' | null
  time?: number | null
  locale?: string
  publishedAt?: string | null
  firstPublishedAt?: string | null
  cover?: StrapiMediaFile | null
  category?: { documentId?: string, id?: number } | null
  ingredients?: StrapiIngredient[] | null
  nutrition?: StrapiNutrition | null
  reviews?: StrapiReview[] | null
  seo?: StrapiSeoFields | StrapiSeoFields[] | null
}

function normalizeSeo(seo: StrapiRecipe['seo']): StrapiSeoFields | null {
  if (!seo) return null
  if (Array.isArray(seo)) return seo[0] ?? null
  return seo
}

function mapIngredientUnit(unit?: string) {
  if (!unit || unit === 'none') return 'none' as const
  const normalized = unit.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
  if (normalized === 'g') return 'g' as const
  if (normalized === 'kg') return 'kg' as const
  if (normalized === 'l') return 'l' as const
  if (normalized === 'ml') return 'ml' as const
  if (normalized === 'mg') return 'mg' as const
  if (normalized.includes('soupe')) return 'cuillere_soupe' as const
  if (normalized.includes('cafe')) return 'cuillere_cafe' as const
  if (normalized === 'tasse') return 'tasse' as const
  return 'none' as const
}

const RECIPE_KEYS = [
  'title',
  'intro',
  'step',
  'slug',
  'difficulty',
  'time',
  'coverBlobPathname',
  'categoryId',
  'locale',
  'status',
  'publishedAt',
  'firstPublishedAt',
] as const

function mapIngredients(row: StrapiRecipe) {
  return (row.ingredients ?? []).map((ingredient, index) => ({
    name: ingredient.name || 'ingrédient',
    qty: ingredient.qty ?? null,
    unit: mapIngredientUnit(ingredient.unit),
    sortOrder: index,
  }))
}

function mapReviews(row: StrapiRecipe) {
  return (row.reviews ?? []).map(review => ({
    star: review.star ?? null,
    content: review.content ?? null,
    authorName: review.authorName ?? null,
    status: 'approved' as const,
  }))
}

function mapNutrition(row: StrapiRecipe) {
  if (!row.nutrition) return null
  return {
    lipides: row.nutrition.lipides ?? null,
    proteine: row.nutrition.proteine ?? null,
    sucre: row.nutrition.sucre ?? null,
    calories: row.nutrition.calories ?? null,
    glucides: row.nutrition.glucides ?? null,
    sodium: row.nutrition.sodium ?? null,
  }
}

async function recipePayloadMatchesDb(
  db: ExtractContext['db'],
  recipeId: number,
  values: Record<string, unknown>,
  row: StrapiRecipe,
  seo: StrapiSeoFields | null,
) {
  const existing = await db.select().from(schema.recipes).where(eq(schema.recipes.id, recipeId)).get()
  if (!existing || !shallowFieldsEqual(existing, values, RECIPE_KEYS)) return false

  const ingredients = await db.select().from(schema.ingredients).where(eq(schema.ingredients.recipeId, recipeId)).all()
  const normalizedIngredients = ingredients
    .map(i => ({ name: i.name, qty: i.qty, unit: i.unit, sortOrder: i.sortOrder }))
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
  if (stableJson(normalizedIngredients) !== stableJson(mapIngredients(row))) return false

  const nutrition = await db.select().from(schema.nutrition).where(eq(schema.nutrition.recipeId, recipeId)).get()
  const nutritionPayload = mapNutrition(row)
  if (stableJson(nutrition ?? null) !== stableJson(nutritionPayload)) return false

  const reviews = await db.select().from(schema.reviews).where(eq(schema.reviews.recipeId, recipeId)).all()
  const normalizedReviews = reviews.map(r => ({
    star: r.star,
    content: r.content,
    authorName: r.authorName,
    status: r.status,
  }))
  if (stableJson(normalizedReviews) !== stableJson(mapReviews(row))) return false

  const existingSeo = await db.select().from(schema.seo).where(eq(schema.seo.recipeId, recipeId)).get()
  if (!seo && !existingSeo) return true
  if (!seo || !existingSeo) return false
  return (seo.description ?? null) === existingSeo.description
    && (seo.keywords ?? null) === existingSeo.keywords
    && (seo.metaRobots ?? 'index, follow') === (existingSeo.metaRobots ?? 'index, follow')
}

export async function extractRecipes(ctx: ExtractContext, mediaStats: StrapiEntityStats): Promise<StrapiEntityStats> {
  const stats = { created: 0, updated: 0, skipped: 0, errors: 0 }
  const client = createStrapiClient({ baseUrl: ctx.strapiUrl, token: ctx.strapiApiToken })

  ctx.log('Import des recettes…')

  for await (const row of iterateStrapiRows<StrapiRecipe>(ctx, client, 'recipes')) {
    const sourceId = strapiSourceId(row)
    if (!sourceId) continue

    try {
      const existingId = await ctx.queries.legacyStrapiMap.findDestId( 'recipes', sourceId)
      const locale = row.locale || 'fr'
      const coverPath = await importStrapiMedia(ctx, row.cover ?? undefined, mediaStats)
      const intro = await rewriteStrapiUploadsInText(ctx, row.intro, mediaStats, ctx.strapiUrl)
      const step = await rewriteStrapiUploadsInText(ctx, row.step, mediaStats, ctx.strapiUrl)

      let categoryId: number | null = null
      if (row.category) {
        const catSource = strapiSourceId(row.category)
        const mapped = catSource ? await ctx.queries.legacyStrapiMap.findDestId( 'categories', catSource) : null
        categoryId = mapped ? Number.parseInt(mapped, 10) : null
      }

      const values = {
        title: row.title,
        intro,
        step,
        slug: row.slug,
        difficulty: row.difficulty ?? 'easy',
        time: row.time ?? null,
        coverBlobPathname: coverPath,
        categoryId,
        locale,
        localeGroupId: sourceId,
        status: row.publishedAt ? 'published' as const : 'draft' as const,
        publishedAt: row.publishedAt,
        firstPublishedAt: row.firstPublishedAt ?? row.publishedAt,
      }

      const seo = normalizeSeo(row.seo)
      let unchanged = false
      if (existingId) {
        unchanged = await recipePayloadMatchesDb(
          ctx.db,
          Number.parseInt(existingId, 10),
          values,
          row,
          seo,
        )
      }

      if (ctx.dryRun) {
        bumpImportStats(stats, dryRunOutcome(existingId, unchanged))
        continue
      }

      if (existingId && unchanged) {
        bumpImportStats(stats, 'skip')
        continue
      }

      let recipeId: number
      if (existingId) {
        recipeId = Number.parseInt(existingId, 10)
        await ctx.db.update(schema.recipes).set(values).where(eq(schema.recipes.id, recipeId))
        bumpImportStats(stats, 'update')
      }
      else {
        const inserted = await ctx.db.insert(schema.recipes).values(values).returning().get()
        recipeId = inserted.id
        await ctx.queries.legacyStrapiMap.upsert( {
          sourceType: 'recipes',
          sourceId,
          destTable: 'recipes',
          destId: recipeId,
        }, false)
        bumpImportStats(stats, 'create')
      }

      await ctx.db.delete(schema.ingredients).where(eq(schema.ingredients.recipeId, recipeId))
      if (row.ingredients?.length) {
        await ctx.db.insert(schema.ingredients).values(
          mapIngredients(row).map(ingredient => ({
            recipeId,
            ...ingredient,
          })),
        )
      }

      const nutritionPayload = mapNutrition(row)
      if (nutritionPayload) {
        await ctx.db.insert(schema.nutrition).values({
          recipeId,
          ...nutritionPayload,
        }).onConflictDoUpdate({
          target: schema.nutrition.recipeId,
          set: nutritionPayload,
        })
      }

      await ctx.db.delete(schema.reviews).where(eq(schema.reviews.recipeId, recipeId))
      if (row.reviews?.length) {
        await ctx.db.insert(schema.reviews).values(
          mapReviews(row).map(review => ({
            recipeId,
            ...review,
          })),
        )
      }

      if (seo) {
        await upsertContentSeo(ctx.db, { recipeId }, seo)
      }
    }
    catch (error) {
      stats.errors += 1
      ctx.log(`Recette « ${row.slug} » : ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  return stats
}
