/**
 * PUT /api/category-articles/[id] — Update an article category.
 *
 * Auth required (enforced by middleware).
 *
 * Body (all optional):
 * - name, slug, locale, localeGroupId, status, publishedAt
 *
 * If name is updated, the slug is NOT automatically regenerated —
 * use a dedicated slug-update endpoint or pass slug explicitly.
 */
import { eq } from 'drizzle-orm'
import { schema } from '../../db/create-db'
import { updateArticleCategorySchema } from '../../utils/validations/categories'
import { validateBody } from '../../utils/validate'
import { createApiError } from '../../utils/errors'
import { canEditContent } from '../../../shared/abilities'
import { useDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  await authorize(event, canEditContent)

  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isFinite(id) || id < 1) {
    throw createApiError('VALIDATION_ERROR', 'Invalid category ID')
  }

  const db = useDb(event)
  const body = validateBody(updateArticleCategorySchema, await readBody(event))

  // Check category exists
  const existing = await db
    .select({ id: schema.categoryArticles.id })
    .from(schema.categoryArticles)
    .where(eq(schema.categoryArticles.id, id))
    .limit(1)
    .all()

  if (existing.length === 0) {
    throw createApiError('NOT_FOUND', 'Category not found')
  }

  const now = new Date().toISOString()

  const rows = await db
    .update(schema.categoryArticles)
    .set({
      name: body.name,
      slug: body.slug,
      locale: body.locale,
      localeGroupId: body.localeGroupId,
      status: body.status,
      publishedAt: body.publishedAt,
      updatedAt: now,
    })
    .where(eq(schema.categoryArticles.id, id))
    .returning()
    .all()

  const updated = rows[0]
  if (!updated) {
    throw createApiError('INTERNAL_ERROR', 'Failed to update article category')
  }

  return { data: updated }
})
