import { and, eq, sql, desc } from 'drizzle-orm'
import type { AppDb } from '../create-db'
import { pages } from '../schema/pages'
import { paginateResult } from '../../utils/pagination'
import {
  buildPagesWith,
  buildPageDetailQueryWhere,
  type PagesQueryOptions,
} from './_shared/builders/pages'
import { mergeConditions, applyPublishedScope, localeFilter } from './_shared/filters'
import { reorderByIds } from './_shared/list-page'
import { reserveUniqueSlugInLocale } from './_shared/reserve-slug'

export interface PageListOptions extends PagesQueryOptions {
  pagination: { offset: number, limit: number, page: number, pageSize: number }
}

function buildPagesListSqlWhere(opts: PageListOptions) {
  return mergeConditions(
    ...applyPublishedScope(pages, {
      scope: opts.isAuthenticated ? 'admin' : 'public',
      includeDeleted: opts.includeDeleted,
    }),
    localeFilter(pages, opts.locale),
  )
}

export function createPageQueries(db: AppDb) {
  return {
    async listPage(opts: PageListOptions) {
      const where = buildPagesListSqlWhere(opts)

      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(pages)
        .where(where)
        .all()

      const total = countResult[0]?.count ?? 0

      const idRows = await db
        .select({ id: pages.id })
        .from(pages)
        .where(where)
        .orderBy(desc(pages.createdAt))
        .limit(opts.pagination.limit)
        .offset(opts.pagination.offset)
        .all()

      const ids = idRows.map(row => row.id)
      if (ids.length === 0) {
        return paginateResult([], total, opts.pagination.page, opts.pagination.pageSize)
      }

      const rows = reorderByIds(
        await db.query.pages.findMany({
          where: { id: { in: ids } },
          with: buildPagesWith(opts.include),
        }),
        ids,
      )

      return paginateResult(rows, total, opts.pagination.page, opts.pagination.pageSize)
    },

    findById(id: number, include: string[] = [], scope: 'public' | 'admin' = 'public') {
      return db.query.pages.findFirst({
        where: buildPageDetailQueryWhere(id, scope === 'admin'),
        with: buildPagesWith(include),
      })
    },

    async reserveUniqueSlug(baseSlug: string, locale: string) {
      return reserveUniqueSlugInLocale(baseSlug, locale, async (slug, loc) => {
        const existing = await db
          .select({ id: pages.id })
          .from(pages)
          .where(and(eq(pages.slug, slug), eq(pages.locale, loc)))
          .get()
        return existing !== undefined
      })
    },

    insert(values: typeof pages.$inferInsert) {
      return db.insert(pages).values(values).returning().then(rows => rows[0])
    },

    findParentId(id: number) {
      return db
        .select({ id: pages.id, parentId: pages.parentId })
        .from(pages)
        .where(eq(pages.id, id))
        .get()
    },

    findRowById(id: number) {
      return db.select().from(pages).where(eq(pages.id, id)).get()
    },

    async wouldCreateParentCycle(pageId: number, newParentId: number | null): Promise<boolean> {
      if (!newParentId) return false
      if (newParentId === pageId) return true

      let current: number | null = newParentId
      const visited = new Set<number>([pageId])

      while (current !== null) {
        if (visited.has(current)) return true
        visited.add(current)

        const parent = await db
          .select({ parentId: pages.parentId })
          .from(pages)
          .where(eq(pages.id, current))
          .get()

        if (!parent) break
        current = parent.parentId ?? null
      }

      return false
    },

    updateById(id: number, updates: Partial<typeof pages.$inferInsert>) {
      return db.update(pages).set(updates).where(eq(pages.id, id)).returning().then(rows => rows[0])
    },

    softDelete(id: number) {
      const now = new Date().toISOString()
      return db
        .update(pages)
        .set({ deletedAt: now, updatedAt: now })
        .where(eq(pages.id, id))
        .then(() => now)
    },
  }
}
