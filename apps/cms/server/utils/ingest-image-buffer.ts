import type { H3Event } from 'nitro/h3'
import type { MediaFileMetadata } from '../../shared/media-file-metadata'
import { MEDIA_UPLOAD_ROOT } from '../../shared/media-paths'
import { extractImageFileMetadata } from './extract-image-metadata'
import { buildMediaPathname, useMediaStorage } from './media-storage'
import { useQueries } from './db'

export interface IngestImageAttribution {
  photographer?: string
  photographerUrl?: string
  sourceUrl?: string
  sourceName?: string
}

export interface IngestImageBufferOptions {
  buffer: ArrayBuffer | Uint8Array
  contentType: string
  originalName?: string
  altText?: string
  folderPrefix?: string
  source?: 'upload' | 'pexels' | 'ai'
  stockProvider?: 'pexels'
  stockExternalId?: string
  attribution?: IngestImageAttribution
  aiPrompt?: string
  width?: number
  height?: number
}

export interface IngestImageBufferResult {
  pathname: string
  contentType: string
  size: number
  duplicate: boolean
  width?: number
  height?: number
}

function buildFileMetadata(opts: IngestImageBufferOptions, extracted?: MediaFileMetadata | null): MediaFileMetadata {
  const meta: MediaFileMetadata = { ...(extracted ?? {}) }

  if (opts.attribution?.photographer) {
    meta.creator = opts.attribution.photographer
    meta.credit = opts.attribution.photographer
  }
  if (opts.attribution?.sourceName) {
    meta.source = opts.attribution.sourceName
  }
  if (opts.attribution?.sourceUrl) {
    meta.description = meta.description ?? opts.attribution.sourceUrl
  }
  if (opts.stockProvider) {
    meta.stockProvider = opts.stockProvider
  }
  if (opts.stockExternalId) {
    meta.stockExternalId = opts.stockExternalId
  }
  if (opts.aiPrompt) {
    meta.aiPrompt = opts.aiPrompt.slice(0, 500)
    meta.software = meta.software ?? 'Workers AI'
  }
  if (opts.source === 'ai') {
    meta.software = 'Workers AI'
  }

  return meta
}

function hasMetadata(meta: MediaFileMetadata): boolean {
  return Object.entries(meta).some(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return false
    }
    if (key === 'location' && typeof value === 'object') {
      return Object.values(value).some(Boolean)
    }
    if (Array.isArray(value)) {
      return value.length > 0
    }
    return true
  })
}

/**
 * Store image bytes in R2/local + register in the blobs catalog.
 * Dedupes stock imports via `stockProvider` + `stockExternalId`.
 */
export async function ingestImageBuffer(
  event: H3Event,
  opts: IngestImageBufferOptions,
): Promise<IngestImageBufferResult> {
  const blobs = useQueries(event).blobs
  const bytes = opts.buffer instanceof Uint8Array
    ? opts.buffer
    : new Uint8Array(opts.buffer)

  if (opts.stockProvider && opts.stockExternalId) {
    const existing = await blobs.findByStockExternal(opts.stockProvider, opts.stockExternalId)
    if (existing) {
      return {
        pathname: existing.pathname,
        contentType: existing.mimeType ?? opts.contentType,
        size: existing.size ?? bytes.byteLength,
        duplicate: true,
        width: existing.width ?? undefined,
        height: existing.height ?? undefined,
      }
    }
  }

  const extracted = await extractImageFileMetadata(bytes, opts.contentType)
  const fileMetadata = buildFileMetadata(opts, extracted)
  const storage = useMediaStorage(event)
  const filename = opts.originalName ?? `image.${opts.contentType.split('/')[1] ?? 'webp'}`
  const pathname = buildMediaPathname(filename, opts.folderPrefix ?? MEDIA_UPLOAD_ROOT)

  const uploaded = await storage.putBuffer(pathname, bytes, opts.contentType)

  const altText = opts.altText?.trim()
    || opts.attribution?.photographer
    || extracted?.description
    || undefined

  const catalogValues = {
    pathname: uploaded.pathname,
    originalName: opts.originalName ?? uploaded.pathname.split('/').pop() ?? uploaded.pathname,
    mimeType: uploaded.contentType,
    size: uploaded.size,
    width: opts.width,
    height: opts.height,
    altText,
    fileMetadata: hasMetadata(fileMetadata) ? fileMetadata : undefined,
  }

  await blobs.upsertImportedCatalog(catalogValues, {
    originalName: catalogValues.originalName,
    mimeType: catalogValues.mimeType,
    size: catalogValues.size,
    width: catalogValues.width,
    height: catalogValues.height,
    altText: catalogValues.altText,
    fileMetadata: catalogValues.fileMetadata,
  })

  return {
    pathname: uploaded.pathname,
    contentType: uploaded.contentType,
    size: uploaded.size,
    duplicate: false,
    width: catalogValues.width,
    height: catalogValues.height,
  }
}
