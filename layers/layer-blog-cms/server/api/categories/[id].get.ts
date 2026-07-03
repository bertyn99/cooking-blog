/**
 * GET /api/categories/[id] — Get a single recipe category.
 *
 * Draft protection: unauthenticated users can only view published +
 * non-deleted categories. Returns 404 if the category is not found
 * or is a draft for unauthenticated users.
 */
import { db, schema } from 'hub:db'
import { eq, and, isNull } from 'drizzle-orm'
import { createApiError } from '../../utils/errors'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isFinite(id) || id < 1) {
    throw createApiError('VALIDATION_ERROR', 'Invalid category ID')
  }

  const isAuthenticated = !!event.context?.user

  // Build where conditions
  const conditions = [eq(schema.categories.id, id)]

  // Draft protection
  if (!isAuthenticated) {
    conditions.push(eq(schema.categories.status, 'published'))
    conditions.push(isNull(schema.categories.deletedAt))
  }

  const rows = await db
    .select()
    .from(schema.categories)
    .where(and(...conditions))
    .limit(1)
    .all()

  const category = rows[0]
  if (!category) {
    throw createApiError('NOT_FOUND', 'Category not found')
  }

  return { data: category }
})
