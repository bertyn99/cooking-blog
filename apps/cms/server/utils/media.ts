import type { H3Event } from 'h3'
import type { DbQueries } from '../db/queries'
import type { BlobRow } from '../db/queries/blobs'
import {
  MEDIA_FOLDER_MARKER,
  MEDIA_FOLDER_MARKER_MIME,
  MEDIA_UPLOAD_ROOT,
  isMediaFolderMarkerPathname,
  mediaKindFromMime,
  normalizeMediaFolderPrefix,
  slugifyFolderSegment,
} from '../../shared/media-paths'
import { createApiError } from './errors'
import { useQueries } from './db'
import { useMediaStorage } from './media-storage'
import { extractImageFileMetadata, readStorageBuffer } from './extract-image-metadata'
import {
  buildMediaDetailSections,
  type MediaDetailSection,
  type MediaFileMetadata,
} from '../../shared/media-file-metadata'

export type BlobQueries = DbQueries['blobs']

export interface MediaListItem {
  pathname: string
  contentType?: string
  size?: number
  uploadedAt?: string
  originalName?: string
  width?: number
  height?: number
  altText?: string
  kind: ReturnType<typeof mediaKindFromMime>
}

export interface MediaFolderItem {
  slug: string
  name: string
  prefix: string
  itemCount: number
}

export interface MediaListResult {
  blobs: MediaListItem[]
  folders: MediaFolderItem[]
  prefix: string
  hasMore: boolean
  cursor?: string
}

export async function uploadMedia(
  event: H3Event,
  file: File,
  opts?: { folderPrefix?: string },
) {
  const storage = useMediaStorage(event)
  const sourceBuffer = await file.arrayBuffer()
  const fileMetadata = await extractImageFileMetadata(sourceBuffer, file.type)
  const uploaded = await storage.put(file, opts?.folderPrefix)
  const blobs = useQueries(event).blobs

  try {
    await blobs.insert({
      pathname: uploaded.pathname,
      originalName: file.name,
      mimeType: uploaded.contentType,
      size: uploaded.size,
      fileMetadata: fileMetadata ?? undefined,
    })
  }
  catch {
    // DB insert is best-effort; object is already stored
  }

  return uploaded
}

/** Register a stored file in the `blobs` catalog (media gallery). */
export async function ensureBlobCatalogRecord(
  blobs: BlobQueries,
  event: H3Event | undefined,
  pathname: string,
  meta?: {
    originalName?: string
    mimeType?: string
    size?: number
    width?: number
    height?: number
    altText?: string
    fileMetadata?: MediaFileMetadata | null
  },
) {
  const row = await blobs.findPathnameOnly(pathname)
  if (row) return

  const storage = useMediaStorage(event)
  const head = await storage.head(pathname)
  if (!head) return

  await blobs.upsertCatalogRecord(pathname, {
    originalName: meta?.originalName,
    mimeType: meta?.mimeType ?? head.contentType,
    size: meta?.size ?? head.size,
    width: meta?.width,
    height: meta?.height,
    altText: meta?.altText,
    fileMetadata: meta?.fileMetadata,
  })
}

export function getMediaUrl(pathname: string): string {
  return `/images/${pathname}`
}

function rowToListItem(row: BlobRow): MediaListItem {
  const mime = row.mimeType ?? undefined
  return {
    pathname: row.pathname,
    contentType: mime,
    size: row.size ?? undefined,
    uploadedAt: row.createdAt,
    originalName: row.originalName ?? undefined,
    width: row.width ?? undefined,
    height: row.height ?? undefined,
    altText: row.altText ?? undefined,
    kind: mediaKindFromMime(mime),
  }
}

export async function getMediaDetail(event: H3Event, pathname: string) {
  const blobs = useQueries(event).blobs
  const row = await blobs.findByPathname(pathname)
  if (!row) {
    throw createApiError('NOT_FOUND', 'Media not found')
  }
  const storage = useMediaStorage(event)
  const head = await storage.head(pathname)

  let fileMetadata = row.fileMetadata ?? null
  if (!fileMetadata && row.mimeType?.startsWith('image/') && !isMediaFolderMarkerPathname(pathname)) {
    const buffer = await readStorageBuffer(event, pathname)
    if (buffer) {
      const extracted = await extractImageFileMetadata(buffer, row.mimeType)
      if (extracted) {
        fileMetadata = extracted
        await blobs.updateByPathname(pathname, {
          fileMetadata: extracted,
          updatedAt: new Date().toISOString(),
        })
      }
    }
  }

  const extraSections: MediaDetailSection[] = buildMediaDetailSections({
    altText: row.altText,
    metadata: fileMetadata,
    pathname: row.pathname,
    contentType: row.mimeType ?? undefined,
    etag: head?.etag,
    storageSize: head?.size,
    catalogSize: row.size ?? undefined,
    updatedAt: row.updatedAt,
  })

  return {
    ...rowToListItem(row),
    url: getMediaUrl(pathname),
    storageSize: head?.size,
    etag: head?.etag,
    updatedAt: row.updatedAt,
    fileMetadata,
    extraSections,
  }
}

export async function renameMediaFile(
  event: H3Event,
  pathname: string,
  originalName: string,
) {
  const name = originalName.trim()
  if (!name) {
    throw createApiError('VALIDATION_ERROR', 'Name is required')
  }
  const blobs = useQueries(event).blobs
  const row = await blobs.findByPathname(pathname)
  if (!row) {
    throw createApiError('NOT_FOUND', 'Media not found')
  }
  await blobs.updateByPathname(pathname, { originalName: name, updatedAt: new Date().toISOString() })
  return getMediaDetail(event, pathname)
}

export async function updateMediaAccessibility(
  event: H3Event,
  pathname: string,
  patch: { originalName?: string, altText?: string | null, description?: string | null },
) {
  const blobs = useQueries(event).blobs
  const row = await blobs.findByPathname(pathname)
  if (!row) {
    throw createApiError('NOT_FOUND', 'Media not found')
  }
  if (isMediaFolderMarkerPathname(pathname)) {
    throw createApiError('VALIDATION_ERROR', 'Folders cannot be edited this way')
  }

  const updates: {
    originalName?: string
    altText?: string | null
    fileMetadata?: MediaFileMetadata | null
    updatedAt: string
  } = {
    updatedAt: new Date().toISOString(),
  }

  if (patch.originalName !== undefined) {
    const name = patch.originalName.trim()
    if (!name) {
      throw createApiError('VALIDATION_ERROR', 'Name is required')
    }
    updates.originalName = name
  }

  if (patch.altText !== undefined) {
    updates.altText = patch.altText?.trim() || null
  }

  if (patch.description !== undefined) {
    const meta: MediaFileMetadata = { ...(row.fileMetadata ?? {}) }
    const next = patch.description?.trim()
    if (next) {
      meta.description = next
    }
    else {
      delete meta.description
    }
    updates.fileMetadata = Object.keys(meta).length ? meta : null
  }

  await blobs.updateByPathname(pathname, updates)
  return getMediaDetail(event, pathname)
}

export async function createMediaFolder(
  event: H3Event,
  opts: { name: string, parentPrefix?: string },
) {
  const parent = normalizeMediaFolderPrefix(opts.parentPrefix)
  const slug = slugifyFolderSegment(opts.name)
  if (!slug) {
    throw createApiError('VALIDATION_ERROR', 'Invalid folder name')
  }
  const markerPath = `${parent}${slug}/${MEDIA_FOLDER_MARKER}`
  const blobs = useQueries(event).blobs
  const existing = await blobs.findPathnameOnly(markerPath)
  if (existing) {
    throw createApiError('CONFLICT', 'A folder with this name already exists')
  }
  await blobs.insertFolderMarker({
    pathname: markerPath,
    originalName: opts.name.trim(),
    mimeType: MEDIA_FOLDER_MARKER_MIME,
    size: 0,
  })
  return {
    slug,
    name: opts.name.trim(),
    prefix: `${parent}${slug}/`,
    itemCount: 0,
  }
}

export async function deleteMediaFolder(event: H3Event, folderPrefix: string) {
  const prefix = normalizeMediaFolderPrefix(folderPrefix)
  const blobs = useQueries(event).blobs
  const rows = await blobs.listByPathPrefix(prefix)

  for (const row of rows) {
    if (isMediaFolderMarkerPathname(row.pathname)) {
      await blobs.deleteByPathname(row.pathname)
      continue
    }
    await blobs.clearReferences(row.pathname)
    await deleteMedia(event, row.pathname)
  }
}

export async function deleteMediaBlob(event: H3Event, pathname: string) {
  if (isMediaFolderMarkerPathname(pathname)) {
    throw createApiError('VALIDATION_ERROR', 'Use folder delete for folders')
  }
  const blobs = useQueries(event).blobs
  const row = await blobs.findByPathname(pathname)
  if (!row) {
    throw createApiError('NOT_FOUND', 'Media not found')
  }
  await blobs.clearReferences(pathname)
  await deleteMedia(event, pathname)
}

export async function deleteMedia(event: H3Event, pathname: string) {
  const storage = useMediaStorage(event)
  await storage.del(pathname)
  try {
    await useQueries(event).blobs.deleteByPathname(pathname)
  }
  catch {
    // DB cleanup is best-effort
  }
}

export async function listMedia(
  event: H3Event,
  opts: { limit?: number, cursor?: string, prefix?: string },
): Promise<MediaListResult> {
  const blobs = useQueries(event).blobs
  const limit = Math.min(Math.max(opts.limit ?? 20, 1), 100)
  const offset = opts.cursor ? Number.parseInt(opts.cursor, 10) : 0
  const safeOffset = Number.isFinite(offset) && offset >= 0 ? offset : 0
  const prefix = normalizeMediaFolderPrefix(opts.prefix || MEDIA_UPLOAD_ROOT)

  const folderRows = await blobs.listFolderMarkers(prefix)

  const folders: MediaFolderItem[] = []
  for (const row of folderRows) {
    const relative = row.pathname.slice(prefix.length)
    if (!relative.endsWith(`/${MEDIA_FOLDER_MARKER}`)) {
      continue
    }
    const slug = relative.slice(0, -(MEDIA_FOLDER_MARKER.length + 1))
    if (!slug || slug.includes('/')) {
      continue
    }
    const folderPrefix = `${prefix}${slug}/`
    folders.push({
      slug,
      name: row.originalName ?? slug,
      prefix: folderPrefix,
      itemCount: await blobs.countUnderPrefix(folderPrefix),
    })
  }

  const fileRows = await blobs.listGalleryFiles(prefix, limit + 1, safeOffset)

  const hasMore = fileRows.length > limit
  const page = hasMore ? fileRows.slice(0, limit) : fileRows

  return {
    prefix,
    folders,
    blobs: page.map(rowToListItem),
    hasMore,
    cursor: hasMore ? String(safeOffset + limit) : undefined,
  }
}
