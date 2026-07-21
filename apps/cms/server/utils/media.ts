import type { H3Event } from 'h3'
import { desc, eq, like } from 'drizzle-orm'
import type { AppDb } from '../db/create-db'
import { schema } from '../db/create-db'
import { useDb } from './db'
import { useMediaStorage } from './media-storage'

export interface MediaListItem {
  pathname: string
  contentType?: string
  size?: number
  uploadedAt?: string
  originalName?: string
}

export interface MediaListResult {
  blobs: MediaListItem[]
  hasMore: boolean
  cursor?: string
}

export async function uploadMedia(event: H3Event, file: File, db: AppDb) {
  const storage = useMediaStorage(event)
  const uploaded = await storage.put(file)

  try {
    await db.insert(schema.blobs).values({
      pathname: uploaded.pathname,
      originalName: file.name,
      mimeType: uploaded.contentType,
      size: uploaded.size,
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
  }).onConflictDoNothing()
}

export function getMediaUrl(pathname: string): string {
  return `/images/${pathname}`
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
  const prefix = opts.prefix ?? 'uploads/'

  const rows = await db
    .select()
    .from(schema.blobs)
    .where(like(schema.blobs.pathname, `${prefix}%`))
    .orderBy(desc(schema.blobs.createdAt))
    .limit(limit + 1)
    .offset(safeOffset)
    .all()

  const hasMore = rows.length > limit
  const page = hasMore ? rows.slice(0, limit) : rows

  return {
    blobs: page.map(row => ({
      pathname: row.pathname,
      contentType: row.mimeType ?? undefined,
      size: row.size ?? undefined,
      uploadedAt: row.createdAt,
      originalName: row.originalName ?? undefined,
    })),
    hasMore,
    cursor: hasMore ? String(safeOffset + limit) : undefined,
  }
}
