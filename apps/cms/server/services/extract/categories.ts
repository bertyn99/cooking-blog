import { eq } from 'drizzle-orm'
import type { ExtractContext, StrapiEntityStats, StrapiMediaFile } from './types'
import { strapiSourceId } from './types'
import { findLegacyDestId, upsertLegacyMap } from './legacy-map'
import { createStrapiClient } from './strapi-client'
import { importStrapiMedia } from './media'
import { bumpImportStats, dryRunOutcome, shallowFieldsEqual } from './import-row'
import { schema } from '../../db/create-db'

interface StrapiCategory {
  id: number
  documentId?: string
  name: string
  desc?: string | null
  slug: string
  locale?: string
  publishedAt?: string | null
  img?: StrapiMediaFile[] | null
}

const COMPARE_KEYS = ['name', 'desc', 'slug', 'locale', 'status', 'publishedAt'] as const

export async function extractCategories(ctx: ExtractContext, mediaStats: StrapiEntityStats): Promise<StrapiEntityStats> {
  const stats = { created: 0, updated: 0, skipped: 0, errors: 0 }
  const client = createStrapiClient({ baseUrl: ctx.strapiUrl, token: ctx.strapiApiToken })

  ctx.log('Import des catégories de recettes…')

  for await (const row of client.listAll<StrapiCategory>('categories')) {
    const sourceId = strapiSourceId(row)
    if (!sourceId) continue

    try {
      const existingId = await findLegacyDestId(ctx.db, 'categories', sourceId)
      const locale = row.locale || 'fr'

      let existingRow: typeof schema.categories.$inferSelect | undefined
      if (existingId) {
        existingRow = await ctx.db
          .select()
          .from(schema.categories)
          .where(eq(schema.categories.id, Number.parseInt(existingId, 10)))
          .get()
      }

      const values = {
        name: row.name,
        desc: row.desc ?? null,
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

      if (existingId && existingRow && unchanged) {
        bumpImportStats(stats, 'skip')
        continue
      }

      let categoryId: number
      if (existingId && existingRow) {
        categoryId = existingRow.id
        await ctx.db.update(schema.categories).set(values).where(eq(schema.categories.id, categoryId))
        bumpImportStats(stats, 'update')
      }
      else {
        const inserted = await ctx.db.insert(schema.categories).values(values).returning().get()
        categoryId = inserted.id
        await upsertLegacyMap(ctx.db, {
          sourceType: 'categories',
          sourceId,
          destTable: 'categories',
          destId: categoryId,
        }, false)
        bumpImportStats(stats, 'create')
      }

      if (row.img?.length) {
        await ctx.db.delete(schema.categoryBlobs).where(eq(schema.categoryBlobs.categoryId, categoryId))
        let order = 0
        for (const image of row.img) {
          const pathname = await importStrapiMedia(ctx, image, mediaStats)
          if (!pathname) continue
          await ctx.db.insert(schema.categoryBlobs).values({
            categoryId,
            blobPathname: pathname,
            sortOrder: order++,
          })
        }
      }
    }
    catch (error) {
      stats.errors += 1
      ctx.log(`Catégorie recette « ${row.slug} » : ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  return stats
}
