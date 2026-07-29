import { and, eq, isNull, sql } from 'drizzle-orm'
import type { AppDb } from '../create-db'
import { schema } from '../create-db'
import { paginateResult } from '../../utils/pagination'
import { reserveUniqueSlugInLocale } from './_shared/reserve-slug'
import { tags } from '../schema/tags'

export type TaggableContentType = 'article' | 'recipe' | 'page'

export function createTagQueries(db: AppDb) {
  return {
    async listPage(opts: {
      locale?: string
      pagination: { offset: number, limit: number, page: number, pageSize: number }
    }) {
      const where = and(
        isNull(tags.deletedAt),
        opts.locale ? eq(tags.locale, opts.locale) : undefined,
      )

      const total = (await db.select({ count: sql<number>`count(*)` }).from(tags).where(where).all())[0]?.count ?? 0
      const rows = await db
        .select()
        .from(tags)
        .where(where)
        .orderBy(sql`${tags.name} ASC`)
        .limit(opts.pagination.limit)
        .offset(opts.pagination.offset)
        .all()

      return paginateResult(rows, total, opts.pagination.page, opts.pagination.pageSize)
    },

    findById(id: number) {
      return db.select().from(tags).where(and(eq(tags.id, id), isNull(tags.deletedAt))).get()
    },

    async reserveUniqueSlug(baseSlug: string, locale: string) {
      return reserveUniqueSlugInLocale(baseSlug, locale, async (slug, loc) => {
        const existing = await db
          .select({ id: tags.id })
          .from(tags)
          .where(and(eq(tags.slug, slug), eq(tags.locale, loc), isNull(tags.deletedAt)))
          .get()
        return existing !== undefined
      })
    },

    insert(values: typeof schema.tags.$inferInsert) {
      return db.insert(schema.tags).values(values).returning().get()
    },

    updateById(id: number, updates: Partial<typeof schema.tags.$inferInsert>) {
      return db.update(tags).set(updates).where(eq(tags.id, id)).returning().get()
    },

    softDelete(id: number) {
      const now = new Date().toISOString()
      return db.update(tags).set({ deletedAt: now, updatedAt: now }).where(eq(tags.id, id))
    },

    listForContent(contentType: TaggableContentType, contentId: number) {
      return db
        .select({ tag: tags })
        .from(schema.contentTags)
        .innerJoin(tags, eq(schema.contentTags.tagId, tags.id))
        .where(and(
          eq(schema.contentTags.contentType, contentType),
          eq(schema.contentTags.contentId, contentId),
          isNull(tags.deletedAt),
        ))
        .all()
        .then(rows => rows.map(r => r.tag))
    },

    async replaceForContent(contentType: TaggableContentType, contentId: number, tagIds: number[]) {
      await db
        .delete(schema.contentTags)
        .where(and(
          eq(schema.contentTags.contentType, contentType),
          eq(schema.contentTags.contentId, contentId),
        ))

      if (tagIds.length === 0) return

      await db.insert(schema.contentTags).values(
        tagIds.map(tagId => ({ contentType, contentId, tagId })),
      )
    },
  }
}
