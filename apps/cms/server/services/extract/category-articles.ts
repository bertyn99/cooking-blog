import { eq } from 'drizzle-orm'
import type { ExtractContext, StrapiEntityStats } from './types'
import { strapiSourceId } from './types'
import { findLegacyDestId, upsertLegacyMap } from './legacy-map'
import { createStrapiClient } from './strapi-client'
import { bumpImportStats, dryRunOutcome, shallowFieldsEqual } from './import-row'
import { schema } from '../../db/create-db'

interface StrapiCategoryArticle {
  id: number
  documentId?: string
  name: string
  slug: string
  locale?: string
  publishedAt?: string | null
}

const COMPARE_KEYS = ['name', 'slug', 'locale', 'status', 'publishedAt'] as const

export async function extractCategoryArticles(ctx: ExtractContext): Promise<StrapiEntityStats> {
  const stats = { created: 0, updated: 0, skipped: 0, errors: 0 }
  const client = createStrapiClient({ baseUrl: ctx.strapiUrl, token: ctx.strapiApiToken })

  ctx.log('Import des catégories d’articles…')

  for await (const row of client.listAll<StrapiCategoryArticle>('category-articles')) {
    const sourceId = strapiSourceId(row)
    if (!sourceId) continue

    try {
      const existingId = await findLegacyDestId(ctx.db, 'category-articles', sourceId)
      const locale = row.locale || 'fr'

      let existingRow: typeof schema.categoryArticles.$inferSelect | undefined
      if (existingId) {
        existingRow = await ctx.db
          .select()
          .from(schema.categoryArticles)
          .where(eq(schema.categoryArticles.id, Number.parseInt(existingId, 10)))
          .get()
      }

      const values = {
        name: row.name,
        slug: row.slug,
        locale,
        status: 'published' as const,
        publishedAt: row.publishedAt ?? existingRow?.publishedAt ?? new Date().toISOString(),
      }

      const unchanged = Boolean(
        existingRow && shallowFieldsEqual(existingRow, values, COMPARE_KEYS),
      )

      if (ctx.dryRun) {
        bumpImportStats(stats, dryRunOutcome(existingId, unchanged))
        continue
      }

      if (existingId && existingRow) {
        if (unchanged) {
          bumpImportStats(stats, 'skip')
          continue
        }
        await ctx.db.update(schema.categoryArticles)
          .set(values)
          .where(eq(schema.categoryArticles.id, existingRow.id))
        bumpImportStats(stats, 'update')
        continue
      }

      const inserted = await ctx.db.insert(schema.categoryArticles).values(values).returning().get()
      await upsertLegacyMap(ctx.db, {
        sourceType: 'category-articles',
        sourceId,
        destTable: 'category_articles',
        destId: inserted.id,
      }, false)
      bumpImportStats(stats, 'create')
    }
    catch (error) {
      stats.errors += 1
      ctx.log(`Catégorie article « ${row.slug} » : ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  return stats
}
