import type { ExtractContext, StrapiEntityStats, StrapiMediaFile } from './types'
import { strapiSourceId } from './types'
import { findLegacyDestId, upsertLegacyMap } from './legacy-map'
import { createStrapiClient } from './strapi-client'
import { schema } from '../../db/create-db'
import { strapiMediaPathnameFromUrl, useMediaStorage } from '../../utils/media-storage'

export async function importStrapiMedia(
  ctx: ExtractContext,
  file: StrapiMediaFile | null | undefined,
  stats: StrapiEntityStats,
): Promise<string | null> {
  if (!file?.url) return null

  const sourceId = strapiSourceId(file)
  if (!sourceId) return null

  const pathname = strapiMediaPathnameFromUrl(file.url)
  const mapped = await findLegacyDestId(ctx.db, 'media', sourceId)
  if (mapped === pathname) {
    stats.skipped += 1
    return pathname
  }

  const storage = useMediaStorage(ctx.event)
  const existing = await storage.head(pathname)
  if (existing) {
    if (!ctx.dryRun) {
      await upsertLegacyMap(ctx.db, {
        sourceType: 'media',
        sourceId,
        destTable: 'blobs',
        destId: pathname,
      }, false)
    }
    stats.skipped += 1
    return pathname
  }

  if (ctx.dryRun) {
    stats.created += 1
    return pathname
  }

  try {
    const client = createStrapiClient({
      baseUrl: ctx.strapiUrl,
      token: ctx.strapiApiToken,
    })
    const buffer = await client.downloadFile(file.url)
    const contentType = file.mime || 'application/octet-stream'
    const uploaded = await storage.putBuffer(pathname, buffer, contentType)

    await ctx.db.insert(schema.blobs).values({
      pathname: uploaded.pathname,
      originalName: file.name,
      mimeType: uploaded.contentType,
      size: uploaded.size,
      width: file.width,
      height: file.height,
      altText: file.alternativeText,
    }).onConflictDoUpdate({
      target: schema.blobs.pathname,
      set: {
        originalName: file.name,
        mimeType: uploaded.contentType,
        size: uploaded.size,
        width: file.width,
        height: file.height,
        altText: file.alternativeText,
      },
    })

    await upsertLegacyMap(ctx.db, {
      sourceType: 'media',
      sourceId,
      destTable: 'blobs',
      destId: pathname,
    }, false)

    if (mapped) {
      stats.updated += 1
    }
    else {
      stats.created += 1
    }
    return pathname
  }
  catch (error) {
    stats.errors += 1
    const message = error instanceof Error ? error.message : String(error)
    ctx.log(`Média ${pathname} : ${message}`)
    return null
  }
}
