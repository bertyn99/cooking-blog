import { validateBody } from '../../utils/validate'
import { updateArticleSchema } from '../../utils/validations/articles'
import { useQueries, useDb } from '../../utils/db'
import { requireEditor } from '../../utils/http-auth'
import { applyContentStatusPolicy } from '../../utils/content-status-policy'
import { createApiError, fromQueryError } from '../../utils/errors'
import { authorshipOnUpdate } from '../../utils/content-authorship'
import {
  assertHumanReviewAllowsPublish,
  hasArticleEditorialChanges,
  nextVersionAfterHumanReviewEdit,
} from '../../utils/human-review-publish'

export default defineEventHandler(async (event) => {
  const session = await requireEditor(event)

  const id = Number.parseInt(getRouterParam(event, 'id') || '', 10)
  if (Number.isNaN(id)) {
    throw createApiError('NOT_FOUND', 'Article introuvable.')
  }

  const { articles } = useQueries(event)
  const existing = await articles.findRowById(id)
  if (!existing) {
    throw createApiError('NOT_FOUND', 'Article introuvable.')
  }

  const body = await readBody(event)
  const data = validateBody(updateArticleSchema, body)

  const statusFields = applyContentStatusPolicy(session.user, existing, {
    status: data.status,
    scheduledAt: data.scheduledAt,
  })

  const updates: Record<string, unknown> = {
    ...data,
    ...authorshipOnUpdate(session.user.id),
    ...(data.status !== undefined
      ? {
          status: statusFields.status ?? data.status,
          publishedAt: statusFields.publishedAt,
          scheduledAt: statusFields.scheduledAt,
          firstPublishedAt: statusFields.firstPublishedAt,
        }
      : {}),
  }

  const editorialChanged = hasArticleEditorialChanges(
    existing as Record<string, unknown>,
    updates,
  )
  const versionBump = nextVersionAfterHumanReviewEdit(existing, editorialChanged)
  if (versionBump !== undefined) {
    updates.version = versionBump
  }

  const nextStatus = (updates.status as string | undefined) ?? existing.status
  if (nextStatus === 'published' && existing.status !== 'published') {
    const versionForGate = (updates.version as number | undefined) ?? existing.version ?? 1
    try {
      await assertHumanReviewAllowsPublish(
        useDb(event),
        'article',
        id,
        versionForGate,
        Boolean(existing.requiresHumanReview),
      )
    }
    catch (error) {
      fromQueryError(error)
    }
  }

  return articles.updateById(id, updates)
})
