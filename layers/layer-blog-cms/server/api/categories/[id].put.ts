/**
 * PUT /api/categories/[id] — Update a recipe category.
 *
 * Auth required (enforced by middleware).
 *
 * Body (all optional):
 * - name, desc, slug, locale, localeGroupId, status, publishedAt
 *
 * If name is updated, the slug is NOT automatically regenerated —
 * use a dedicated slug-update endpoint or pass slug explicitly.
 */
import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'
import { updateRecipeCategorySchema } from '../../utils/validations/categories'
import { validateBody } from '../../utils/validate'
import { createApiError } from '../../utils/errors'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isFinite(id) || id < 1) {
    throw createApiError('VALIDATION_ERROR', 'Invalid category ID')
  }

  const body = validateBody(updateRecipeCategorySchema, await readBody(event))

  // Check category exists
  const existing = await db
    .select({ id: schema.categories.id })
    .from(schema.categories)
    .where(eq(schema.categories.id, id))
    .limit(1)
    .all()

  if (existing.length === 0) {
    throw createApiError('NOT_FOUND', 'Category not found')
  }

  const now = new Date().toISOString()

  const rows = await db
    .update(schema.categories)
    .set({
      name: body.name,
      desc: body.desc,
      slug: body.slug,
      locale: body.locale,
      localeGroupId: body.localeGroupId,
      status: body.status,
      publishedAt: body.publishedAt,
      updatedAt: now,
    })
    .where(eq(schema.categories.id, id))
    .returning()
    .all()

  const updated = rows[0]
  if (!updated) {
    throw createApiError('INTERNAL_ERROR', 'Failed to update category')
  }

  return { data: updated }
})
