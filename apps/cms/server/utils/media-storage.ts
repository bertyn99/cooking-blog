import { createHash, randomUUID } from 'node:crypto'
import { mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import type { H3Event } from 'h3'
import { MAX_IMAGE_UPLOAD_BYTES, maxImageUploadSizeLabel } from '../../shared/media'
import { useR2 } from './r2'

const UPLOAD_PREFIX = 'uploads/'

export interface MediaObject {
  pathname: string
  contentType: string
  size: number
  etag?: string
}

export interface MediaListResult {
  objects: MediaObject[]
  cursor?: string
  truncated: boolean
}

export interface MediaStorage {
  put(file: File): Promise<MediaObject>
  putBuffer(pathname: string, data: ArrayBuffer | Buffer, contentType: string): Promise<MediaObject>
  head(pathname: string): Promise<MediaObject | null>
  get(pathname: string): Promise<{ body: ReadableStream, object: MediaObject } | null>
  del(pathname: string): Promise<void>
  list(opts: { limit?: number, cursor?: string, prefix?: string }): Promise<MediaListResult>
}

function localMediaRoot() {
  return join(process.cwd(), '.data/media')
}

function sanitizeFilename(name: string) {
  return name.replace(/[^\w.-]+/g, '-').replace(/-+/g, '-').slice(0, 120)
}

export function validateImageFile(file: File) {
  if (!file.type.startsWith('image/')) {
    throw createError({ statusCode: 400, statusMessage: 'Only image files are allowed' })
  }
  if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
    throw createError({
      statusCode: 400,
      statusMessage: `Image must be ${maxImageUploadSizeLabel()} or smaller`,
    })
  }
}

function buildPathname(filename: string) {
  return `${UPLOAD_PREFIX}${randomUUID()}-${sanitizeFilename(filename)}`
}

function assertSafePathname(pathname: string) {
  if (!pathname.startsWith(UPLOAD_PREFIX) || pathname.includes('..')) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid media path' })
  }
}

function toBuffer(data: ArrayBuffer | Buffer): Buffer {
  return data instanceof Buffer ? data : Buffer.from(new Uint8Array(data))
}

function strapiUrlToPathname(url: string) {
  const normalized = url.startsWith('/') ? url.slice(1) : url
  assertSafePathname(normalized)
  return normalized
}

function createR2Storage(bucket: R2Bucket): MediaStorage {
  return {
    async put(file) {
      validateImageFile(file)
      const pathname = buildPathname(file.name)
      const uploaded = await bucket.put(pathname, file.stream(), {
        httpMetadata: { contentType: file.type },
      })
      return {
        pathname,
        contentType: file.type,
        size: file.size,
        etag: uploaded?.etag,
      }
    },

    async putBuffer(pathname, data, contentType) {
      assertSafePathname(pathname)
      const body = toBuffer(data)
      const uploaded = await bucket.put(pathname, body, {
        httpMetadata: { contentType },
      })
      return {
        pathname,
        contentType,
        size: body.byteLength,
        etag: uploaded?.etag,
      }
    },

    async head(pathname) {
      const object = await bucket.head(pathname)
      if (!object) return null
      return {
        pathname,
        contentType: object.httpMetadata?.contentType ?? 'application/octet-stream',
        size: object.size,
        etag: object.etag,
      }
    },

    async get(pathname) {
      const object = await bucket.get(pathname)
      if (!object) return null
      return {
        body: object.body,
        object: {
          pathname,
          contentType: object.httpMetadata?.contentType ?? 'application/octet-stream',
          size: object.size,
          etag: object.etag,
        },
      }
    },

    async del(pathname) {
      await bucket.delete(pathname)
    },

    async list(opts) {
      const listed = await bucket.list({
        limit: opts.limit ?? 20,
        cursor: opts.cursor,
        prefix: opts.prefix ?? UPLOAD_PREFIX,
      })

      return {
        objects: listed.objects.map(obj => ({
          pathname: obj.key,
          contentType: obj.httpMetadata?.contentType ?? 'application/octet-stream',
          size: obj.size,
          etag: obj.etag,
        })),
        cursor: listed.truncated ? listed.cursor : undefined,
        truncated: listed.truncated,
      }
    },
  }
}

function createLocalStorage(): MediaStorage {
  const root = localMediaRoot()

  async function resolvePath(pathname: string) {
    const full = join(root, pathname)
    if (!full.startsWith(root)) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid media path' })
    }
    return full
  }

  return {
    async put(file) {
      validateImageFile(file)
      const pathname = buildPathname(file.name)
      const full = await resolvePath(pathname)
      await mkdir(dirname(full), { recursive: true })
      const buffer = Buffer.from(await file.arrayBuffer())
      await writeFile(full, buffer)
      const hash = createHash('sha256').update(buffer).digest('hex')
      return {
        pathname,
        contentType: file.type,
        size: file.size,
        etag: hash,
      }
    },

    async putBuffer(pathname, data, contentType) {
      assertSafePathname(pathname)
      const full = await resolvePath(pathname)
      await mkdir(dirname(full), { recursive: true })
      const buffer = toBuffer(data)
      await writeFile(full, buffer)
      const hash = createHash('sha256').update(buffer).digest('hex')
      return {
        pathname,
        contentType,
        size: buffer.byteLength,
        etag: hash,
      }
    },

    async head(pathname) {
      try {
        const full = await resolvePath(pathname)
        const info = await stat(full)
        const ext = pathname.split('.').pop()?.toLowerCase()
        const contentType = ext === 'webp' ? 'image/webp'
          : ext === 'png' ? 'image/png'
            : ext === 'gif' ? 'image/gif'
              : 'image/jpeg'
        return {
          pathname,
          contentType,
          size: info.size,
          etag: info.mtimeMs.toString(),
        }
      }
      catch {
        return null
      }
    },

    async get(pathname) {
      try {
        const full = await resolvePath(pathname)
        const buffer = await readFile(full)
        const object = await this.head(pathname)
        if (!object) return null
        return {
          body: new ReadableStream({
            start(controller) {
              controller.enqueue(buffer)
              controller.close()
            },
          }),
          object,
        }
      }
      catch {
        return null
      }
    },

    async del(pathname) {
      const full = await resolvePath(pathname)
      await rm(full, { force: true })
    },

    async list(opts) {
      const prefix = opts.prefix ?? UPLOAD_PREFIX
      const dir = join(root, prefix)
      await mkdir(dir, { recursive: true })
      const entries = await readdir(dir, { withFileTypes: true })
      const objects: MediaObject[] = []

      for (const entry of entries) {
        if (!entry.isFile()) continue
        const pathname = `${prefix}${entry.name}`
        const meta = await this.head(pathname)
        if (meta) objects.push(meta)
      }

      const limit = opts.limit ?? 20
      const start = opts.cursor ? Number.parseInt(opts.cursor, 10) : 0
      const slice = objects.slice(start, start + limit)
      const next = start + limit

      return {
        objects: slice,
        cursor: next < objects.length ? String(next) : undefined,
        truncated: next < objects.length,
      }
    },
  }
}

export function useMediaStorage(event?: H3Event): MediaStorage {
  const bucket = useR2(event)
  return bucket ? createR2Storage(bucket) : createLocalStorage()
}

/**
 * Strapi image transforms embed the original under a second `/uploads/` segment, e.g.
 * `/uploads/width_410,height_287,fit_cover/uploads/foo.webp` → `/uploads/foo.webp`.
 */
export function canonicalStrapiUploadPath(uploadPath: string): string {
  let path = uploadPath
  if (path.startsWith('http://') || path.startsWith('https://')) {
    path = new URL(path).pathname
  }
  const withSlash = path.startsWith('/') ? path : `/${path}`
  if (!withSlash.startsWith('/uploads/')) return withSlash
  const segments = withSlash.split('/uploads/').filter(Boolean)
  const filePart = segments[segments.length - 1] ?? ''
  return `/uploads/${filePart}`
}

/** Map Strapi `/uploads/...` URL to CMS media pathname (`uploads/...`). */
export function strapiMediaPathnameFromUrl(url: string) {
  return strapiUrlToPathname(canonicalStrapiUploadPath(url))
}
