import { blob, ensureBlob } from 'hub:blob'
import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'

export async function uploadMedia(file: File) {
  // Built-in validation: images only, max 5MB
  ensureBlob(file, { maxSize: '4MB', types: ['image'] })

  const uploaded = await blob.put(file.name, file, {
    addRandomSuffix: true,
    prefix: 'uploads/',
  })

  // Optional: create DB record for metadata tracking
  try {
    await db.insert(schema.blobs).values({
      pathname: uploaded.pathname,
      originalName: file.name,
      mimeType: uploaded.contentType ?? file.type,
      size: uploaded.size ?? file.size,
    })
  }
  catch {
    // DB insert is best-effort; blob is already stored
  }

  return uploaded
}

export function getMediaUrl(pathname: string): string {
  return `/images/${pathname}`
}

export async function deleteMedia(pathname: string) {
  await blob.del(pathname)
  try {
    await db.delete(schema.blobs).where(eq(schema.blobs.pathname, pathname))
  }
  catch {
    // DB cleanup is best-effort
  }
}

export async function listMedia(opts: { limit?: number; cursor?: string; prefix?: string }) {
  return blob.list({
    limit: opts.limit ?? 20,
    cursor: opts.cursor,
    prefix: opts.prefix ?? 'uploads/',
  })
}
