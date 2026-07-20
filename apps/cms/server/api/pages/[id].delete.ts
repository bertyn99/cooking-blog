/**
 * DELETE /api/pages/[id] — Soft delete a page.
 *
 * Auth required (enforced by middleware).
 *
 * Sets deletedAt to the current timestamp instead of physically removing
 * the row. The page becomes invisible to unauthenticated users but remains
 * recoverable by admins.
 *
 * Returns 404 if the page does not exist or is already soft-deleted.
 */
import { eq } from 'drizzle-orm'
import { pages } from '../../db/schema/pages'
import { createApiError } from '../../utils/errors'
import { canEditContent } from '../../../shared/abilities'
import { useDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  await authorize(event, canEditContent)

  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isFinite(id) || id < 1) {
    throw createApiError('VALIDATION_ERROR', 'Invalid page ID')
  }

  const db = useDb(event)

  // Check page exists and is not already deleted
  const existing = await db
    .select({ id: pages.id, deletedAt: pages.deletedAt })
    .from(pages)
    .where(eq(pages.id, id))
    .limit(1)

  if (existing.length === 0) {
    throw createApiError('NOT_FOUND', 'Page not found')
  }

  if (existing[0]!.deletedAt !== null) {
    throw createApiError('VALIDATION_ERROR', 'Page is already deleted')
  }

  const now = new Date().toISOString()

  await db
    .update(pages)
    .set({
      deletedAt: now,
      updatedAt: now,
    })
    .where(eq(pages.id, id))

  return { data: { id, deletedAt: now } }
})
