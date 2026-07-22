import { validateBody } from '../../utils/validate'
import { updateArticleSchema } from '../../utils/validations/articles'
import { useQueries } from '../../utils/db'
import { requireEditor } from '../../utils/http-auth'
import { applyContentStatusPolicy } from '../../utils/content-status-policy'
import { createApiError } from '../../utils/errors'

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

  const updates: Record<string, unknown> = { ...data }
  applyContentStatusPolicy(session.user, existing, updates)

  return articles.updateById(id, updates)
})
