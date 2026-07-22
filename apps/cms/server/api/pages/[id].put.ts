import { updatePageSchema } from '../../utils/validations/pages'
import { validateBody } from '../../utils/validate'
import { createApiError } from '../../utils/errors'
import { canEditContent } from '../../../shared/abilities'
import { useQueries } from '../../utils/db'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  await authorize(event, canEditContent)

  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isFinite(id) || id < 1) {
    throw createApiError('VALIDATION_ERROR', 'Invalid page ID')
  }

  const { pages } = useQueries(event)
  const body = validateBody(updatePageSchema, await readBody(event))

  const existing = await pages.findParentId(id)
  if (!existing) {
    throw createApiError('NOT_FOUND', 'Page not found')
  }

  if (body.parentId !== undefined && body.parentId !== existing.parentId) {
    const cycleDetected = await pages.wouldCreateParentCycle(id, body.parentId ?? null)
    if (cycleDetected) {
      throw createApiError(
        'VALIDATION_ERROR',
        'Circular parent reference detected. A page cannot be its own ancestor.',
        { pageId: id, proposedParentId: body.parentId },
      )
    }
  }

  const now = new Date().toISOString()

  const updated = await pages.updateById(id, {
    name: body.name,
    title: body.title,
    content: body.content,
    parentId: body.parentId,
    locale: body.locale,
    localeGroupId: body.localeGroupId,
    updatedAt: now,
  })

  if (!updated) {
    throw createApiError('INTERNAL_ERROR', 'Failed to update page')
  }

  return { data: updated }
})
