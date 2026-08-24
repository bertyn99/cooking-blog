import { and, eq, inArray } from 'drizzle-orm'
import type { H3Event } from 'nitro/h3'
import { schema } from '../db/create-db'
import { useDb } from './db'

const { categoryArticles, categories } = schema

export async function resolveArticleCategoryIds(
  event: H3Event,
  opts: { names?: string[]; slug?: string },
): Promise<number[] | undefined> {
  const db = useDb(event)

  if (opts.slug) {
    const row = await db
      .select({ id: categoryArticles.id })
      .from(categoryArticles)
      .where(eq(categoryArticles.slug, opts.slug))
      .get()
    return row ? [row.id] : []
  }

  if (opts.names?.length) {
    const rows = await db
      .select({ id: categoryArticles.id })
      .from(categoryArticles)
      .where(inArray(categoryArticles.name, opts.names))
      .all()
    return rows.map(r => r.id)
  }

  return undefined
}

export async function resolveRecipeCategoryIds(
  event: H3Event,
  opts: { names?: string[]; slug?: string },
): Promise<number[] | undefined> {
  const db = useDb(event)

  if (opts.slug) {
    const row = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.slug, opts.slug))
      .get()
    return row ? [row.id] : []
  }

  if (opts.names?.length) {
    const rows = await db
      .select({ id: categories.id })
      .from(categories)
      .where(inArray(categories.name, opts.names))
      .all()
    return rows.map(r => r.id)
  }

  return undefined
}
