import { and, eq } from 'drizzle-orm'
import type { AppDb } from '../create-db'
import { schema } from '../create-db'
import { mediaFolders, contentMedia } from '../schema/media-folders'

export type ContentMediaType = 'article' | 'recipe' | 'page'

export function createMediaFolderQueries(db: AppDb) {
  return {
    listAll() {
      return db.select().from(mediaFolders).orderBy(mediaFolders.pathPrefix).all()
    },

    findById(id: number) {
      return db.select().from(mediaFolders).where(eq(mediaFolders.id, id)).get()
    },

    findByPathPrefix(pathPrefix: string) {
      return db.select().from(mediaFolders).where(eq(mediaFolders.pathPrefix, pathPrefix)).get()
    },

    insert(values: typeof schema.mediaFolders.$inferInsert) {
      return db.insert(mediaFolders).values(values).returning().get()
    },

    updateById(id: number, updates: Partial<typeof schema.mediaFolders.$inferInsert>) {
      return db.update(mediaFolders).set(updates).where(eq(mediaFolders.id, id)).returning().get()
    },

    deleteById(id: number) {
      return db.delete(mediaFolders).where(eq(mediaFolders.id, id))
    },

    listContentMedia(contentType: ContentMediaType, contentId: number) {
      return db
        .select()
        .from(contentMedia)
        .where(and(
          eq(contentMedia.contentType, contentType),
          eq(contentMedia.contentId, contentId),
        ))
        .orderBy(contentMedia.sortOrder)
        .all()
    },

    async replaceContentMedia(
      contentType: ContentMediaType,
      contentId: number,
      items: Array<{ blobPathname: string, role?: 'gallery' | 'inline' | 'attachment', sortOrder?: number }>,
    ) {
      await db
        .delete(contentMedia)
        .where(and(
          eq(contentMedia.contentType, contentType),
          eq(contentMedia.contentId, contentId),
        ))

      if (items.length === 0) return

      await db.insert(contentMedia).values(
        items.map((item, index) => ({
          contentType,
          contentId,
          blobPathname: item.blobPathname,
          role: item.role ?? 'gallery',
          sortOrder: item.sortOrder ?? index,
        })),
      )
    },
  }
}
