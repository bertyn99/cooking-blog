import { eq } from 'drizzle-orm'
import type { AppDb } from '../../db/create-db'
import type { StrapiSeoFields } from './types'
import { schema } from '../../db/create-db'

export async function upsertContentSeo(
  db: AppDb,
  owner: { articleId?: number, recipeId?: number, pageId?: number },
  seo: StrapiSeoFields,
) {
  let existing
  if (owner.articleId) {
    existing = await db.select().from(schema.seo).where(eq(schema.seo.articleId, owner.articleId)).get()
  }
  else if (owner.recipeId) {
    existing = await db.select().from(schema.seo).where(eq(schema.seo.recipeId, owner.recipeId)).get()
  }
  else if (owner.pageId) {
    existing = await db.select().from(schema.seo).where(eq(schema.seo.pageId, owner.pageId)).get()
  }

  const values = {
    articleId: owner.articleId ?? null,
    recipeId: owner.recipeId ?? null,
    pageId: owner.pageId ?? null,
    description: seo.description ?? null,
    keywords: seo.keywords ?? null,
    metaRobots: seo.metaRobots ?? 'index, follow',
  }

  if (existing) {
    await db.update(schema.seo).set(values).where(eq(schema.seo.id, existing.id))
    return existing.id
  }

  const inserted = await db.insert(schema.seo).values(values).returning().get()
  return inserted.id
}
