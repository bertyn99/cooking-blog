/**
 * DELETE /api/categories/[id] — Soft delete a recipe category.
 *
 * Auth required (enforced by middleware).
 *
 * Sets deletedAt to the current timestamp instead of physically removing
 * the row. The category becomes invisible to unauthenticated users but
 * remains recoverable by admins.
 *
 * Returns 404 if the category does not exist or is already soft-deleted.
 */
import { eq } from 'drizzle-orm'
import { schema } from '../../db/create-db'
import { createApiError } from '../../utils/errors'
import { useDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isFinite(id) || id < 1) {
    throw createApiError('VALIDATION_ERROR', 'Invalid category ID')
  }

  const db = useDb(event)

  // Check category exists and is not already deleted
  const existing = await db
    .select({ id: schema.categories.id, deletedAt: schema.categories.deletedAt })
    .from(schema.categories)
    .where(eq(schema.categories.id, id))
    .limit(1)
    .all()

  if (existing.length === 0) {
    throw createApiError('NOT_FOUND', 'Category not found')
  }

  if (existing[0]!.deletedAt !== null) {
    throw createApiError('VALIDATION_ERROR', 'Category is already deleted')
  }

  const now = new Date().toISOString()

  await db
    .update(schema.categories)
    .set({
      deletedAt: now,
      updatedAt: now,
    })
    .where(eq(schema.categories.id, id))
    .run()

  return { data: { id, deletedAt: now } }
})
