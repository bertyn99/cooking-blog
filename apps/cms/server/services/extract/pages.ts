import { eq } from 'drizzle-orm'
import type { ExtractContext, StrapiEntityStats, StrapiSeoFields } from './types'
import { strapiSourceId } from './types'
import { findLegacyDestId, upsertLegacyMap } from './legacy-map'
import { createStrapiClient } from './strapi-client'
import { iterateStrapiRows } from './strapi-iterate'
import { strapiZonesToMarkdown } from './zones-to-markdown'
import { rewriteStrapiUploadsInText } from './content-media'
import { upsertContentSeo } from './seo'
import { bumpImportStats, dryRunOutcome, shallowFieldsEqual } from './import-row'
import { schema } from '../../db/create-db'

interface StrapiPage {
  id: number
  documentId?: string
  name: string
  title?: string | null
  slug: string
  content?: unknown
  locale?: string
  publishedAt?: string | null
  parent?: { documentId?: string, id?: number } | null
  seoMeta?: StrapiSeoFields | null
}

const PAGE_KEYS = ['name', 'title', 'slug', 'content', 'locale', 'status', 'publishedAt'] as const

function seoEqual(a: StrapiSeoFields | null, existing: { description: string | null, keywords: string | null, metaRobots: string | null } | undefined) {
  if (!a && !existing) return true
  if (!a || !existing) return false
  return (a.description ?? null) === existing.description
    && (a.keywords ?? null) === existing.keywords
    && (a.metaRobots ?? 'index, follow') === (existing.metaRobots ?? 'index, follow')
}

export async function extractPages(ctx: ExtractContext, mediaStats: StrapiEntityStats): Promise<StrapiEntityStats> {
  const stats = { created: 0, updated: 0, skipped: 0, errors: 0 }
  const client = createStrapiClient({ baseUrl: ctx.strapiUrl, token: ctx.strapiApiToken })
  const pendingParents: Array<{ pageId: number, parentSourceId: string }> = []

  ctx.log('Import des pages…')

  for await (const row of iterateStrapiRows<StrapiPage>(ctx, client, 'pages')) {
    const sourceId = strapiSourceId(row)
    if (!sourceId) continue

    try {
      const existingId = await findLegacyDestId(ctx.db, 'pages', sourceId)
      const locale = row.locale || 'fr'
      const rawContent = strapiZonesToMarkdown(row.content)
      const content = await rewriteStrapiUploadsInText(
        ctx,
        rawContent,
        mediaStats,
        ctx.strapiUrl,
      ) ?? rawContent
      const values = {
        name: row.name,
        title: row.title ?? row.name,
        slug: row.slug,
        content,
        parentId: null as number | null,
        locale,
        localeGroupId: sourceId,
        status: row.publishedAt ? 'published' as const : 'draft' as const,
        publishedAt: row.publishedAt,
      }

      let existingRow: typeof schema.pages.$inferSelect | undefined
      if (existingId) {
        existingRow = await ctx.db
          .select()
          .from(schema.pages)
          .where(eq(schema.pages.id, Number.parseInt(existingId, 10)))
          .get()
      }

      let existingSeo: typeof schema.seo.$inferSelect | undefined
      if (existingRow) {
        existingSeo = await ctx.db
          .select()
          .from(schema.seo)
          .where(eq(schema.seo.pageId, existingRow.id))
          .get()
      }

      const unchanged = Boolean(
        existingRow
        && shallowFieldsEqual(existingRow, values, PAGE_KEYS)
        && seoEqual(row.seoMeta ?? null, existingSeo),
      )

      if (ctx.dryRun) {
        bumpImportStats(stats, dryRunOutcome(existingId, unchanged))
        continue
      }

      if (existingId && existingRow && unchanged) {
        bumpImportStats(stats, 'skip')
        if (row.parent) {
          const parentSource = strapiSourceId(row.parent)
          if (parentSource) {
            pendingParents.push({ pageId: existingRow.id, parentSourceId: parentSource })
          }
        }
        continue
      }

      let pageId: number
      if (existingId && existingRow) {
        pageId = existingRow.id
        await ctx.db.update(schema.pages).set(values).where(eq(schema.pages.id, pageId))
        bumpImportStats(stats, 'update')
      }
      else {
        const inserted = await ctx.db.insert(schema.pages).values(values).returning().get()
        pageId = inserted.id
        await upsertLegacyMap(ctx.db, {
          sourceType: 'pages',
          sourceId,
          destTable: 'pages',
          destId: pageId,
        }, false)
        bumpImportStats(stats, 'create')
      }

      if (row.parent) {
        const parentSource = strapiSourceId(row.parent)
        if (parentSource) {
          pendingParents.push({ pageId, parentSourceId: parentSource })
        }
      }

      if (row.seoMeta) {
        await upsertContentSeo(ctx.db, { pageId }, row.seoMeta)
      }
    }
    catch (error) {
      stats.errors += 1
      ctx.log(`Page « ${row.slug} » : ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  for (const link of pendingParents) {
    const parentId = await findLegacyDestId(ctx.db, 'pages', link.parentSourceId)
    if (!parentId) continue
    const desiredParentId = Number.parseInt(parentId, 10)
    const page = await ctx.db.select().from(schema.pages).where(eq(schema.pages.id, link.pageId)).get()
    if (page?.parentId === desiredParentId) continue
    await ctx.db.update(schema.pages)
      .set({ parentId: desiredParentId })
      .where(eq(schema.pages.id, link.pageId))
  }

  return stats
}
