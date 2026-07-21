import { eq } from 'drizzle-orm'
import type { ExtractContext, StrapiEntityStats, StrapiMediaFile, StrapiSeoFields } from './types'
import { strapiSourceId } from './types'
import { findLegacyDestId, upsertLegacyMap } from './legacy-map'
import { createStrapiClient } from './strapi-client'
import { iterateStrapiRows } from './strapi-iterate'
import { importStrapiMedia } from './media'
import { rewriteStrapiUploadsInText } from './content-media'
import { upsertContentSeo } from './seo'
import { bumpImportStats, dryRunOutcome, shallowFieldsEqual } from './import-row'
import { schema } from '../../db/create-db'

interface StrapiArticle {
  id: number
  documentId?: string
  title: string
  content?: string | null
  slug: string
  locale?: string
  publishedAt?: string | null
  firstPublishedAt?: string | null
  cover?: StrapiMediaFile | null
  category?: { documentId?: string, id?: number } | null
  seo?: StrapiSeoFields | StrapiSeoFields[] | null
}

const ARTICLE_KEYS = [
  'title',
  'content',
  'slug',
  'coverBlobPathname',
  'categoryId',
  'locale',
  'status',
  'publishedAt',
  'firstPublishedAt',
] as const

function normalizeSeo(seo: StrapiArticle['seo']): StrapiSeoFields | null {
  if (!seo) return null
  if (Array.isArray(seo)) return seo[0] ?? null
  return seo
}

function seoEqual(a: StrapiSeoFields | null, existing: { description: string | null, keywords: string | null, metaRobots: string | null } | undefined) {
  if (!a && !existing) return true
  if (!a || !existing) return false
  return (a.description ?? null) === existing.description
    && (a.keywords ?? null) === existing.keywords
    && (a.metaRobots ?? 'index, follow') === (existing.metaRobots ?? 'index, follow')
}

export async function extractArticles(ctx: ExtractContext, mediaStats: StrapiEntityStats): Promise<StrapiEntityStats> {
  const stats = { created: 0, updated: 0, skipped: 0, errors: 0 }
  const client = createStrapiClient({ baseUrl: ctx.strapiUrl, token: ctx.strapiApiToken })

  ctx.log('Import des articles…')

  for await (const row of iterateStrapiRows<StrapiArticle>(ctx, client, 'articles')) {
    const sourceId = strapiSourceId(row)
    if (!sourceId) continue

    try {
      const existingId = await findLegacyDestId(ctx.db, 'articles', sourceId)
      const locale = row.locale || 'fr'
      const coverPath = await importStrapiMedia(ctx, row.cover ?? undefined, mediaStats)
      const content = await rewriteStrapiUploadsInText(
        ctx,
        row.content,
        mediaStats,
        ctx.strapiUrl,
      )

      let categoryId: number | null = null
      if (row.category) {
        const catSource = strapiSourceId(row.category)
        const mapped = catSource ? await findLegacyDestId(ctx.db, 'category-articles', catSource) : null
        categoryId = mapped ? Number.parseInt(mapped, 10) : null
      }

      let existingRow: typeof schema.articles.$inferSelect | undefined
      if (existingId) {
        existingRow = await ctx.db
          .select()
          .from(schema.articles)
          .where(eq(schema.articles.id, Number.parseInt(existingId, 10)))
          .get()
      }

      const values = {
        title: row.title,
        content,
        slug: row.slug,
        coverBlobPathname: coverPath,
        categoryId,
        locale,
        localeGroupId: sourceId,
        status: row.publishedAt ? 'published' as const : 'draft' as const,
        publishedAt: row.publishedAt,
        firstPublishedAt: row.firstPublishedAt ?? row.publishedAt,
      }

      const seo = normalizeSeo(row.seo)
      let existingSeo: typeof schema.seo.$inferSelect | undefined
      if (existingRow) {
        existingSeo = await ctx.db
          .select()
          .from(schema.seo)
          .where(eq(schema.seo.articleId, existingRow.id))
          .get()
      }

      const unchanged = Boolean(
        existingRow
        && shallowFieldsEqual(existingRow, values, ARTICLE_KEYS)
        && seoEqual(seo, existingSeo),
      )

      if (ctx.dryRun) {
        bumpImportStats(stats, dryRunOutcome(existingId, unchanged))
        continue
      }

      if (existingId && existingRow && unchanged) {
        bumpImportStats(stats, 'skip')
        continue
      }

      let articleId: number
      if (existingId && existingRow) {
        articleId = existingRow.id
        await ctx.db.update(schema.articles).set(values).where(eq(schema.articles.id, articleId))
        bumpImportStats(stats, 'update')
      }
      else {
        const inserted = await ctx.db.insert(schema.articles).values(values).returning().get()
        articleId = inserted.id
        await upsertLegacyMap(ctx.db, {
          sourceType: 'articles',
          sourceId,
          destTable: 'articles',
          destId: articleId,
        }, false)
        bumpImportStats(stats, 'create')
      }

      if (seo) {
        await upsertContentSeo(ctx.db, { articleId }, seo)
      }
    }
    catch (error) {
      stats.errors += 1
      ctx.log(`Article « ${row.slug} » : ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  return stats
}
