import type { H3Event } from 'h3'
import { eq } from 'drizzle-orm'
import type { AppDb } from '../db/create-db'
import { schema } from '../db/create-db'
import { useMediaStorage } from './media-storage'

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
) {
  return useMediaStorage(event).list(opts)
}
