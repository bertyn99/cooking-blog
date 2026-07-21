import type { ExtractContext, StrapiEntityStats, StrapiMediaFile } from './types'
import { strapiSourceId } from './types'
import { findLegacyDestId, upsertLegacyMap } from './legacy-map'
import { createStrapiClient } from './strapi-client'
import { schema } from '../../db/create-db'
import { canonicalStrapiUploadPath, strapiMediaPathnameFromUrl, useMediaStorage } from '../../utils/media-storage'
import { ensureBlobCatalogRecord } from '../../utils/media'
import { extractImageFileMetadata } from '../../utils/extract-image-metadata'
import type { MediaFileMetadata } from '../../../shared/media-file-metadata'

function guessMimeFromPathname(pathname: string): string {
  const ext = pathname.split('.').pop()?.toLowerCase()
  if (ext === 'webp') return 'image/webp'
  if (ext === 'png') return 'image/png'
  if (ext === 'gif') return 'image/gif'
  if (ext === 'svg') return 'image/svg+xml'
  if (ext === 'avif') return 'image/avif'
  return 'image/jpeg'
}

async function persistImportedBlob(
  ctx: ExtractContext,
  opts: {
    pathname: string
    buffer: ArrayBuffer
    contentType: string
    sourceId: string
    stats: StrapiEntityStats
    meta?: Pick<StrapiMediaFile, 'name' | 'width' | 'height' | 'alternativeText' | 'caption'>
    hadLegacyMap: boolean
  },
): Promise<string> {
  const { buffer, contentType, sourceId, stats, meta, hadLegacyMap } = opts
  const storage = useMediaStorage(ctx.event)
  const extracted = await extractImageFileMetadata(buffer, contentType)
  const fileMetadata: MediaFileMetadata | undefined = {
    ...(extracted ?? {}),
    ...(meta?.caption ? { caption: meta.caption, description: extracted?.description ?? meta.caption } : {}),
    ...(meta?.name ? { title: meta.name } : {}),
  }
  const hasMeta = Object.values(fileMetadata).some((value) => {
    if (value === undefined) return false
    if (typeof value === 'object') return Object.values(value).some(Boolean)
    return true
  })

  const uploaded = await storage.putBuffer(pathname, buffer, contentType)

  await ctx.db.insert(schema.blobs).values({
    pathname: uploaded.pathname,
    originalName: meta?.name ?? uploaded.pathname.split('/').pop() ?? uploaded.pathname,
    mimeType: uploaded.contentType,
    size: uploaded.size,
    width: meta?.width,
    height: meta?.height,
    altText: meta?.alternativeText,
    fileMetadata: hasMeta ? fileMetadata : undefined,
  }).onConflictDoUpdate({
    target: schema.blobs.pathname,
    set: {
      originalName: meta?.name ?? uploaded.pathname.split('/').pop() ?? uploaded.pathname,
      mimeType: uploaded.contentType,
      size: uploaded.size,
      width: meta?.width,
      height: meta?.height,
      altText: meta?.alternativeText,
      fileMetadata: hasMeta ? fileMetadata : undefined,
    },
  })

  await upsertLegacyMap(ctx.db, {
    sourceType: 'media',
    sourceId,
    destTable: 'blobs',
    destId: uploaded.pathname,
  }, false)

  await upsertLegacyMap(ctx.db, {
    sourceType: 'media',
    sourceId: `path:${uploaded.pathname}`,
    destTable: 'blobs',
    destId: uploaded.pathname,
  }, false)

  if (hadLegacyMap) stats.updated += 1
  else stats.created += 1

  return uploaded.pathname
}

/** Import a file referenced by `/uploads/…` in markdown (no Strapi media entity). */
export async function importStrapiMediaByUploadPath(
  ctx: ExtractContext,
  uploadPath: string,
  stats: StrapiEntityStats,
): Promise<string | null> {
  const canonicalUploadPath = canonicalStrapiUploadPath(uploadPath)
  const pathname = strapiMediaPathnameFromUrl(canonicalUploadPath)
  const sourceId = `path:${pathname}`

  const mapped = await findLegacyDestId(ctx.db, 'media', sourceId)
  if (mapped === pathname) {
    if (!ctx.dryRun) {
      await ensureBlobCatalogRecord(ctx.db, ctx.event, pathname)
    }
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
      await ensureBlobCatalogRecord(ctx.db, ctx.event, pathname, {
        mimeType: existing.contentType,
        size: existing.size,
      })
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
    const relative = canonicalUploadPath.startsWith('/') ? canonicalUploadPath : `/${canonicalUploadPath}`
    const buffer = await client.downloadFile(relative)
    const contentType = guessMimeFromPathname(pathname)

    return await persistImportedBlob(ctx, {
      pathname,
      buffer,
      contentType,
      sourceId,
      stats,
      hadLegacyMap: Boolean(mapped),
    })
  }
  catch (error) {
    stats.errors += 1
    const message = error instanceof Error ? error.message : String(error)
    ctx.log(`Média ${pathname} : ${message}`)
    return null
  }
}

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
    if (!ctx.dryRun) {
      await ensureBlobCatalogRecord(ctx.db, ctx.event, pathname, {
        originalName: file.name,
        mimeType: file.mime,
        width: file.width,
        height: file.height,
        altText: file.alternativeText,
      })
    }
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
      await upsertLegacyMap(ctx.db, {
        sourceType: 'media',
        sourceId: `path:${pathname}`,
        destTable: 'blobs',
        destId: pathname,
      }, false)
      await ensureBlobCatalogRecord(ctx.db, ctx.event, pathname, {
        originalName: file.name,
        mimeType: file.mime ?? existing.contentType,
        size: existing.size,
        width: file.width,
        height: file.height,
        altText: file.alternativeText,
      })
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
    const downloadPath = canonicalStrapiUploadPath(file.url)
    const buffer = await client.downloadFile(downloadPath)
    const contentType = file.mime || guessMimeFromPathname(pathname)

    return await persistImportedBlob(ctx, {
      pathname,
      buffer,
      contentType,
      sourceId,
      stats,
      hadLegacyMap: Boolean(mapped),
      meta: file,
    })
  }
  catch (error) {
    stats.errors += 1
    const message = error instanceof Error ? error.message : String(error)
    ctx.log(`Média ${pathname} : ${message}`)
    return null
  }
}
