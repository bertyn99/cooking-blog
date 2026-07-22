import { updatePageSchema } from '../../utils/validations/pages'
import { validateBody } from '../../utils/validate'
import { createApiError } from '../../utils/errors'
import { useQueries } from '../../utils/db'
import { requireEditor } from '../../utils/http-auth'
import { applyContentStatusPolicy } from '../../utils/content-status-policy'

export default defineEventHandler(async (event) => {
  const session = await requireEditor(event)

  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isFinite(id) || id < 1) {
    throw createApiError('VALIDATION_ERROR', 'Invalid page ID')
  }

  const { pages } = useQueries(event)
  const body = validateBody(updatePageSchema, await readBody(event))

  const existing = await pages.findRowById(id)
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
  const statusFields = applyContentStatusPolicy(session.user, existing, {
    status: body.status,
    scheduledAt: body.scheduledAt,
  })

  const updated = await pages.updateById(id, {
    name: body.name,
    title: body.title,
    content: body.content,
    parentId: body.parentId,
    locale: body.locale,
    localeGroupId: body.localeGroupId,
    ...(body.status !== undefined
      ? {
          status: statusFields.status ?? body.status,
          publishedAt: statusFields.publishedAt,
          scheduledAt: statusFields.scheduledAt,
        }
      : {}),
    updatedAt: now,
  })

  if (!updated) {
    throw createApiError('INTERNAL_ERROR', 'Failed to update page')
  }

  return { data: updated }
})
