import { and, eq, gte, isNull, lte, notInArray, sql } from 'drizzle-orm'
import { articles } from '../schema/articles'
import { categoryArticles, categories } from '../schema/categories'
import { pinterestPins } from '../schema/pinterest-pins'
import { recipes } from '../schema/recipes'
import type { AppDb } from '../create-db'

export interface PinnableContentMeta {
  contentType: 'articles' | 'recipes'
  id: number
  title: string
  excerpt: string
  content: string | null
  coverBlobPathname: string | null
  categorySlug: string | null
}

/** Rows the drain may act on, oldest `not_before` first. */
export interface DuePinRow {
  id: number
  contentType: string
  contentId: number
  imagePath: string
  isCover: boolean
}

export function createPinterestQueries(db: AppDb) {
  async function loadContentMeta(
    contentType: 'articles' | 'recipes',
    id: number,
  ): Promise<PinnableContentMeta | null> {
    if (contentType === 'articles') {
      const rows = await db
        .select({
          id: articles.id,
          title: articles.title,
          excerpt: articles.excerpt,
          content: articles.content,
          coverBlobPathname: articles.coverBlobPathname,
          categorySlug: categoryArticles.slug,
          status: articles.status,
          deletedAt: articles.deletedAt,
        })
        .from(articles)
        .leftJoin(categoryArticles, eq(articles.categoryId, categoryArticles.id))
        .where(and(eq(articles.id, id), eq(articles.status, 'published'), isNull(articles.deletedAt)))
        .limit(1)
      const row = rows[0]
      if (!row) {
        return null
      }
      return {
        contentType,
        id: row.id,
        title: row.title,
        excerpt: row.excerpt ?? '',
        content: row.content,
        coverBlobPathname: row.coverBlobPathname,
        categorySlug: row.categorySlug,
      }
    }

    const rows = await db
      .select({
        id: recipes.id,
        title: recipes.title,
        excerpt: recipes.excerpt,
        content: recipes.intro,
        coverBlobPathname: recipes.coverBlobPathname,
        categorySlug: categories.slug,
        status: recipes.status,
        deletedAt: recipes.deletedAt,
      })
      .from(recipes)
      .leftJoin(categories, eq(recipes.categoryId, categories.id))
      .where(and(eq(recipes.id, id), eq(recipes.status, 'published'), isNull(recipes.deletedAt)))
      .limit(1)
    const row = rows[0]
    if (!row) {
      return null
    }
    return {
      contentType,
      id: row.id,
      title: row.title,
      excerpt: row.excerpt ?? '',
      content: row.content,
      coverBlobPathname: row.coverBlobPathname,
      categorySlug: row.categorySlug,
    }
  }

  async function existingImageKeys(contentType: string, contentId: number): Promise<Set<string>> {
    const rows = await db
      .select({ imagePath: pinterestPins.imagePath })
      .from(pinterestPins)
      .where(and(eq(pinterestPins.contentType, contentType), eq(pinterestPins.contentId, contentId)))
    return new Set(rows.map(r => r.imagePath))
  }

  async function insertPendingPin(row: {
    contentType: 'articles' | 'recipes'
    contentId: number
    imagePath: string
    isCover: boolean
    notBefore: string
  }): Promise<boolean> {
    const inserted = await db
      .insert(pinterestPins)
      .values({
        contentType: row.contentType,
        contentId: row.contentId,
        imagePath: row.imagePath,
        isCover: row.isCover,
        status: 'pending',
        notBefore: row.notBefore,
        createdAt: new Date().toISOString(),
      })
      .onConflictDoNothing()
      .returning({ id: pinterestPins.id })
    return inserted.length > 0
  }

  async function dueRows(limit: number): Promise<DuePinRow[]> {
    const now = new Date().toISOString()
    return db
      .select({
        id: pinterestPins.id,
        contentType: pinterestPins.contentType,
        contentId: pinterestPins.contentId,
        imagePath: pinterestPins.imagePath,
        isCover: pinterestPins.isCover,
      })
      .from(pinterestPins)
      .where(and(
        eq(pinterestPins.status, 'pending'),
        lte(pinterestPins.notBefore, now),
      ))
      .orderBy(pinterestPins.notBefore)
      .limit(limit)
  }

  async function markPinned(id: number, values: {
    pinId: string
    boardId: string
    title: string
    description: string
  }): Promise<void> {
    await db
      .update(pinterestPins)
      .set({ status: 'pinned', pinnedAt: new Date().toISOString(), error: null, ...values })
      .where(eq(pinterestPins.id, id))
  }

  async function markError(id: number, error: string): Promise<void> {
    await db
      .update(pinterestPins)
      .set({ error: error.slice(0, 500) })
      .where(eq(pinterestPins.id, id))
  }

  async function countPinnedSince(sinceIso: string): Promise<number> {
    const rows = await db
      .select({ count: sql<number>`count(*)` })
      .from(pinterestPins)
      .where(and(eq(pinterestPins.status, 'pinned'), gte(pinterestPins.pinnedAt, sinceIso)))
    return rows[0]?.count ?? 0
  }

  async function summary() {
    const rows = await db
      .select({
        status: pinterestPins.status,
        count: sql<number>`count(*)`,
      })
      .from(pinterestPins)
      .groupBy(pinterestPins.status)
    const byStatus = Object.fromEntries(rows.map(r => [r.status, r.count])) as Record<string, number>
    const recent = await db
      .select({
        id: pinterestPins.id,
        contentType: pinterestPins.contentType,
        contentId: pinterestPins.contentId,
        imagePath: pinterestPins.imagePath,
        isCover: pinterestPins.isCover,
        status: pinterestPins.status,
        pinId: pinterestPins.pinId,
        title: pinterestPins.title,
        notBefore: pinterestPins.notBefore,
        pinnedAt: pinterestPins.pinnedAt,
        error: pinterestPins.error,
      })
      .from(pinterestPins)
      .orderBy(sql`${pinterestPins.id} desc`)
      .limit(25)
    return { byStatus, recent }
  }

  /** Published content ids of a type that have NO pin rows at all (backfill targets). */
  async function publishedWithoutPins(contentType: 'articles' | 'recipes'): Promise<number[]> {
    const pinnedContentIds = db
      .select({ id: pinterestPins.contentId })
      .from(pinterestPins)
      .where(eq(pinterestPins.contentType, contentType))

    if (contentType === 'articles') {
      const rows = await db
        .select({ id: articles.id })
        .from(articles)
        .where(and(
          eq(articles.status, 'published'),
          isNull(articles.deletedAt),
          notInArray(articles.id, pinnedContentIds),
        ))
        .limit(200)
      return rows.map(r => r.id)
    }

    const rows = await db
      .select({ id: recipes.id })
      .from(recipes)
      .where(and(
        eq(recipes.status, 'published'),
        isNull(recipes.deletedAt),
        notInArray(recipes.id, pinnedContentIds),
      ))
      .limit(200)
    return rows.map(r => r.id)
  }

  return {
    loadContentMeta,
    existingImageKeys,
    insertPendingPin,
    dueRows,
    markPinned,
    markError,
    countPinnedSince,
    summary,
    publishedWithoutPins,
  }
}

export type PinterestQueries = ReturnType<typeof createPinterestQueries>
