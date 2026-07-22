import { and, count, desc, eq, isNull, like, not, notLike, or, sql } from 'drizzle-orm'
import type { AppDb } from '../create-db'
import { schema } from '../create-db'
import {
  MEDIA_FOLDER_MARKER,
  MEDIA_FOLDER_MARKER_MIME,
} from '../../../shared/media-paths'
import type { MediaFileMetadata } from '../../../shared/media-file-metadata'

export type BlobRow = typeof schema.blobs.$inferSelect

export function createBlobQueries(db: AppDb) {
  return {
    insert(values: typeof schema.blobs.$inferInsert) {
      return db.insert(schema.blobs).values(values)
    },

    insertOrIgnore(values: typeof schema.blobs.$inferInsert) {
      return db.insert(schema.blobs).values(values).onConflictDoNothing()
    },

    findByPathname(pathname: string) {
      return db.select().from(schema.blobs).where(eq(schema.blobs.pathname, pathname)).get()
    },

    findPathnameOnly(pathname: string) {
      return db
        .select({ pathname: schema.blobs.pathname })
        .from(schema.blobs)
        .where(eq(schema.blobs.pathname, pathname))
        .get()
    },

    updateByPathname(pathname: string, values: Partial<typeof schema.blobs.$inferInsert>) {
      return db.update(schema.blobs).set(values).where(eq(schema.blobs.pathname, pathname))
    },

    deleteByPathname(pathname: string) {
      return db.delete(schema.blobs).where(eq(schema.blobs.pathname, pathname))
    },

    countUnderPrefix(prefix: string) {
      return db
        .select({ count: sql<number>`count(*)` })
        .from(schema.blobs)
        .where(and(
          like(schema.blobs.pathname, `${prefix}%`),
          not(eq(schema.blobs.mimeType, MEDIA_FOLDER_MARKER_MIME)),
        ))
        .get()
        .then(row => row?.count ?? 0)
    },

    clearReferences(pathname: string) {
      return Promise.all([
        db.update(schema.articles).set({ coverBlobPathname: null }).where(eq(schema.articles.coverBlobPathname, pathname)),
        db.update(schema.recipes).set({ coverBlobPathname: null }).where(eq(schema.recipes.coverBlobPathname, pathname)),
        db.delete(schema.categoryBlobs).where(eq(schema.categoryBlobs.blobPathname, pathname)),
        db.update(schema.socialMeta).set({ imageBlobPathname: null }).where(eq(schema.socialMeta.imageBlobPathname, pathname)),
      ])
    },

    listGalleryFiles(prefix: string, limit: number, offset: number) {
      return db
        .select()
        .from(schema.blobs)
        .where(and(
          like(schema.blobs.pathname, `${prefix}%`),
          notLike(schema.blobs.pathname, `${prefix}%/%`),
          not(eq(schema.blobs.mimeType, MEDIA_FOLDER_MARKER_MIME)),
        ))
        .orderBy(desc(schema.blobs.createdAt))
        .limit(limit)
        .offset(offset)
        .all()
    },

    listByPathPrefix(prefix: string) {
      return db
        .select()
        .from(schema.blobs)
        .where(like(schema.blobs.pathname, `${prefix}%`))
        .all()
    },

    insertFolderMarker(values: typeof schema.blobs.$inferInsert) {
      return db.insert(schema.blobs).values(values)
    },

    listFolderMarkers(prefix: string) {
      return db
        .select()
        .from(schema.blobs)
        .where(and(
          eq(schema.blobs.mimeType, MEDIA_FOLDER_MARKER_MIME),
          like(schema.blobs.pathname, `${prefix}%/${MEDIA_FOLDER_MARKER}`),
          notLike(schema.blobs.pathname, `${prefix}%/%/${MEDIA_FOLDER_MARKER}`),
        ))
        .orderBy(desc(schema.blobs.createdAt))
        .all()
    },

    countImagesMissingAlt() {
      return db
        .select({ value: count() })
        .from(schema.blobs)
        .where(and(
          like(schema.blobs.mimeType, 'image/%'),
          not(like(schema.blobs.pathname, `%/${MEDIA_FOLDER_MARKER}`)),
          or(isNull(schema.blobs.altText), sql`trim(${schema.blobs.altText}) = ''`),
        ))
        .get()
        .then(row => Number(row?.value ?? 0))
    },

    upsertCatalogRecord(
      pathname: string,
      meta: {
        originalName?: string
        mimeType?: string
        size?: number
        width?: number
        height?: number
        altText?: string
        fileMetadata?: MediaFileMetadata | null
      },
    ) {
      return db.insert(schema.blobs).values({
        pathname,
        originalName: meta.originalName ?? pathname.split('/').pop() ?? pathname,
        mimeType: meta.mimeType,
        size: meta.size,
        width: meta.width,
        height: meta.height,
        altText: meta.altText,
        fileMetadata: meta.fileMetadata ?? undefined,
      }).onConflictDoNothing()
    },

    upsertImportedCatalog(
      values: typeof schema.blobs.$inferInsert,
      onConflict: Partial<typeof schema.blobs.$inferInsert>,
    ) {
      return db.insert(schema.blobs).values(values).onConflictDoUpdate({
        target: schema.blobs.pathname,
        set: onConflict,
      })
    },
  }
}
