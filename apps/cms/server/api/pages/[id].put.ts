/**
 * PUT /api/pages/[id] — Update a page.
 *
 * Auth required (enforced by middleware).
 *
 * Body (all optional):
 * - name, title, content, parentId, locale, localeGroupId
 *
 * CIRCULAR REFERENCE DETECTION:
 * When setting parentId, walks up the parent chain to ensure it doesn't
 * create a cycle (e.g., page A → parent B → parent A). Returns 400
 * VALIDATION_ERROR if a cycle is detected.
 *
 * If name is updated, the slug is NOT automatically regenerated — the
 * existing slug is preserved. Use a dedicated slug-update endpoint if needed.
 */
import { eq } from 'drizzle-orm'
import type { AppDb } from '../../db/create-db'
import { pages } from '../../db/schema/pages'
import { updatePageSchema } from '../../utils/validations/pages'
import { validateBody } from '../../utils/validate'
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
  const body = validateBody(updatePageSchema, await readBody(event))

  // Check page exists
  const existing = await db
    .select({ id: pages.id, parentId: pages.parentId })
    .from(pages)
    .where(eq(pages.id, id))
    .limit(1)

  if (existing.length === 0) {
    throw createApiError('NOT_FOUND', 'Page not found')
  }

  // Circular reference detection when parentId is being changed
  if (body.parentId !== undefined && body.parentId !== existing[0]!.parentId) {
    const cycleDetected = await checkCircularRef(db, id, body.parentId)
    if (cycleDetected) {
      throw createApiError(
        'VALIDATION_ERROR',
        'Circular parent reference detected. A page cannot be its own ancestor.',
        { pageId: id, proposedParentId: body.parentId },
      )
    }
  }

  const now = new Date().toISOString()

  const rows = await db
    .update(pages)
    .set({
      name: body.name,
      title: body.title,
      content: body.content,
      parentId: body.parentId,
      locale: body.locale,
      localeGroupId: body.localeGroupId,
      updatedAt: now,
    })
    .where(eq(pages.id, id))
    .returning()

  const updated = rows[0]
  if (!updated) {
    throw createApiError('INTERNAL_ERROR', 'Failed to update page')
  }

  return { data: updated }
})

// ---------------------------------------------------------------------------
// Circular reference detection
// ---------------------------------------------------------------------------

/**
 * Walks up the parent chain from `newParentId` to detect circular references.
 *
 * A cycle exists if `newParentId` ultimately points back to `pageId` itself,
 * or if any page appears twice in the ancestry chain.
 *
 * @param pageId       - The page being updated
 * @param newParentId  - The proposed new parent ID (null means no parent = no cycle possible)
 * @returns true if a cycle is detected, false otherwise
 */
async function checkCircularRef(
  db: AppDb,
  pageId: number,
  newParentId: number | null,
): Promise<boolean> {
  // No parent = no cycle possible
  if (!newParentId) return false

  // Self-reference is always a cycle
  if (newParentId === pageId) return true

  let current: number | null = newParentId
  const visited = new Set<number>([pageId])

  while (current !== null) {
    if (visited.has(current)) return true // cycle detected
    visited.add(current)

    const parent = await db
      .select({ parentId: pages.parentId })
      .from(pages)
      .where(eq(pages.id, current))
      .limit(1)

    if (parent.length === 0) break
    current = parent[0]!.parentId ?? null
  }

  return false // no cycle
}
