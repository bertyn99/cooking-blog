import type { H3Event } from 'h3'
import { and, desc, eq, like, not, notLike, sql } from 'drizzle-orm'
import type { AppDb } from '../db/create-db'
import { schema } from '../db/create-db'
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
import { useDb } from './db'
import { useMediaStorage } from './media-storage'
import { extractImageFileMetadata, readStorageBuffer } from './extract-image-metadata'
import {
  buildMediaDetailSections,
  type MediaDetailSection,
  type MediaFileMetadata,
} from '../../shared/media-file-metadata'

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
  db: AppDb,
  opts?: { folderPrefix?: string },
) {
  const storage = useMediaStorage(event)
  const sourceBuffer = await file.arrayBuffer()
  const fileMetadata = await extractImageFileMetadata(sourceBuffer, file.type)
  const uploaded = await storage.put(file, opts?.folderPrefix)

  try {
    await db.insert(schema.blobs).values({
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
  db: AppDb,
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
  const row = await db
    .select({ pathname: schema.blobs.pathname })
    .from(schema.blobs)
    .where(eq(schema.blobs.pathname, pathname))
    .get()
  if (row) return

  const storage = useMediaStorage(event)
  const head = await storage.head(pathname)
  if (!head) return

  await db.insert(schema.blobs).values({
    pathname,
    originalName: meta?.originalName ?? pathname.split('/').pop() ?? pathname,
    mimeType: meta?.mimeType ?? head.contentType,
    size: meta?.size ?? head.size,
    width: meta?.width,
    height: meta?.height,
    altText: meta?.altText,
    fileMetadata: meta?.fileMetadata ?? undefined,
  }).onConflictDoNothing()
}

export function getMediaUrl(pathname: string): string {
  return `/images/${pathname}`
}

function rowToListItem(row: typeof schema.blobs.$inferSelect): MediaListItem {
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

async function countItemsUnderPrefix(db: AppDb, prefix: string) {
  const row = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.blobs)
    .where(and(
      like(schema.blobs.pathname, `${prefix}%`),
      not(eq(schema.blobs.mimeType, MEDIA_FOLDER_MARKER_MIME)),
    ))
    .get()
  return row?.count ?? 0
}

async function clearBlobReferences(db: AppDb, pathname: string) {
  await db.update(schema.articles).set({ coverBlobPathname: null }).where(eq(schema.articles.coverBlobPathname, pathname))
  await db.update(schema.recipes).set({ coverBlobPathname: null }).where(eq(schema.recipes.coverBlobPathname, pathname))
  await db.delete(schema.categoryBlobs).where(eq(schema.categoryBlobs.blobPathname, pathname))
  await db.update(schema.socialMeta).set({ imageBlobPathname: null }).where(eq(schema.socialMeta.imageBlobPathname, pathname))
}

export async function getMediaDetail(event: H3Event, pathname: string) {
  const db = useDb(event)
  const row = await db.select().from(schema.blobs).where(eq(schema.blobs.pathname, pathname)).get()
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
        await db.update(schema.blobs).set({
          fileMetadata: extracted,
          updatedAt: sql`CURRENT_TIMESTAMP`,
        }).where(eq(schema.blobs.pathname, pathname))
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
  db: AppDb,
  pathname: string,
  originalName: string,
) {
  const name = originalName.trim()
  if (!name) {
    throw createApiError('VALIDATION_ERROR', 'Name is required')
  }
  const row = await db.select().from(schema.blobs).where(eq(schema.blobs.pathname, pathname)).get()
  if (!row) {
    throw createApiError('NOT_FOUND', 'Media not found')
  }
  if (isMediaFolderMarkerPathname(pathname)) {
    await db.update(schema.blobs).set({ originalName: name, updatedAt: sql`CURRENT_TIMESTAMP` }).where(eq(schema.blobs.pathname, pathname))
    return getMediaDetail(event, pathname)
  }
  await db.update(schema.blobs).set({ originalName: name, updatedAt: sql`CURRENT_TIMESTAMP` }).where(eq(schema.blobs.pathname, pathname))
  return getMediaDetail(event, pathname)
}

export async function updateMediaAccessibility(
  event: H3Event,
  db: AppDb,
  pathname: string,
  patch: { originalName?: string, altText?: string | null, description?: string | null },
) {
  const row = await db.select().from(schema.blobs).where(eq(schema.blobs.pathname, pathname)).get()
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
    updatedAt: ReturnType<typeof sql>
  } = {
    updatedAt: sql`CURRENT_TIMESTAMP`,
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

  await db.update(schema.blobs).set(updates).where(eq(schema.blobs.pathname, pathname))
  return getMediaDetail(event, pathname)
}

export async function createMediaFolder(
  event: H3Event,
  db: AppDb,
  opts: { name: string, parentPrefix?: string },
) {
  const parent = normalizeMediaFolderPrefix(opts.parentPrefix)
  const slug = slugifyFolderSegment(opts.name)
  if (!slug) {
    throw createApiError('VALIDATION_ERROR', 'Invalid folder name')
  }
  const markerPath = `${parent}${slug}/${MEDIA_FOLDER_MARKER}`
  const existing = await db.select({ pathname: schema.blobs.pathname }).from(schema.blobs).where(eq(schema.blobs.pathname, markerPath)).get()
  if (existing) {
    throw createApiError('CONFLICT', 'A folder with this name already exists')
  }
  await db.insert(schema.blobs).values({
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

export async function deleteMediaFolder(event: H3Event, db: AppDb, folderPrefix: string) {
  const prefix = normalizeMediaFolderPrefix(folderPrefix)
  const rows = await db
    .select()
    .from(schema.blobs)
    .where(like(schema.blobs.pathname, `${prefix}%`))
    .all()

  for (const row of rows) {
    if (isMediaFolderMarkerPathname(row.pathname)) {
      await db.delete(schema.blobs).where(eq(schema.blobs.pathname, row.pathname))
      continue
    }
    await clearBlobReferences(db, row.pathname)
    await deleteMedia(event, row.pathname, db)
  }
}

export async function deleteMediaBlob(event: H3Event, pathname: string, db: AppDb) {
  if (isMediaFolderMarkerPathname(pathname)) {
    throw createApiError('VALIDATION_ERROR', 'Use folder delete for folders')
  }
  const row = await db.select().from(schema.blobs).where(eq(schema.blobs.pathname, pathname)).get()
  if (!row) {
    throw createApiError('NOT_FOUND', 'Media not found')
  }
  await clearBlobReferences(db, pathname)
  await deleteMedia(event, pathname, db)
}

export async function deleteMedia(event: H3Event, pathname: string, db: AppDb) {
  const storage = useMediaStorage(event)
  await storage.del(pathname)
  try {
    await db.delete(schema.blobs).where(eq(schema.blobs.pathname, pathname))
  }
  catch {
    // DB cleanup is best-effort
  }
}

export async function listMedia(
  event: H3Event,
  opts: { limit?: number, cursor?: string, prefix?: string },
): Promise<MediaListResult> {
  const db = useDb(event)
  const limit = Math.min(Math.max(opts.limit ?? 20, 1), 100)
  const offset = opts.cursor ? Number.parseInt(opts.cursor, 10) : 0
  const safeOffset = Number.isFinite(offset) && offset >= 0 ? offset : 0
  const prefix = normalizeMediaFolderPrefix(opts.prefix || MEDIA_UPLOAD_ROOT)

  const folderRows = await db
    .select()
    .from(schema.blobs)
    .where(and(
      eq(schema.blobs.mimeType, MEDIA_FOLDER_MARKER_MIME),
      like(schema.blobs.pathname, `${prefix}%/${MEDIA_FOLDER_MARKER}`),
      notLike(schema.blobs.pathname, `${prefix}%/%/${MEDIA_FOLDER_MARKER}`),
    ))
    .orderBy(desc(schema.blobs.createdAt))
    .all()

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
      itemCount: await countItemsUnderPrefix(db, folderPrefix),
    })
  }

  const fileRows = await db
    .select()
    .from(schema.blobs)
    .where(and(
      like(schema.blobs.pathname, `${prefix}%`),
      notLike(schema.blobs.pathname, `${prefix}%/%`),
      not(eq(schema.blobs.mimeType, MEDIA_FOLDER_MARKER_MIME)),
    ))
    .orderBy(desc(schema.blobs.createdAt))
    .limit(limit + 1)
    .offset(safeOffset)
    .all()

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
