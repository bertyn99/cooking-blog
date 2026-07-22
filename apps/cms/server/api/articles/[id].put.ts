import { validateBody } from '../../utils/validate'
import { updateArticleSchema } from '../../utils/validations/articles'
import { canEditContent } from '../../../shared/abilities'
import { useQueries } from '../../utils/db'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  await authorize(event, canEditContent)

  const id = parseInt(getRouterParam(event, 'id') || '')
  if (isNaN(id)) throw createError({ statusCode: 404 })

  const { articles } = useQueries(event)
  const existing = await articles.findRowById(id)
  if (!existing) throw createError({ statusCode: 404 })

  const body = await readBody(event)
  const data = validateBody(updateArticleSchema, body)

  const updates: Record<string, unknown> = { ...data }

  if (data.status === 'published') {
    updates.publishedAt = new Date().toISOString()
    if (!existing.firstPublishedAt) updates.firstPublishedAt = new Date().toISOString()
  }

  return articles.updateById(id, updates)
})
