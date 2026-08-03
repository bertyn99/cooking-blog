import { createArticleCategorySchema } from '../../utils/validations/categories'
import { validateBody } from '../../utils/validate'
import { createApiError } from '../../utils/errors'
import { slugifyString } from '../../utils/slug'
import { useQueries } from '../../utils/db'
import { requireEditor } from '../../utils/http-auth'
import { applyInitialContentStatusPolicy } from '../../utils/content-status-policy'

export default defineEventHandler(async (event) => {
  const session = await requireEditor(event)

  const body = validateBody(createArticleCategorySchema, await readBody(event))
  const { categoryArticles } = useQueries(event)

  const statusPatch = applyInitialContentStatusPolicy(session.user, {
    status: body.status,
    publishedAt: body.publishedAt,
  })

  const baseSlug = slugifyString(body.name)
  const slug = await categoryArticles.reserveUniqueSlug(baseSlug, body.locale)
  const now = new Date().toISOString()

  const category = await categoryArticles.insert({
    name: body.name,
    slug,
    locale: body.locale,
    localeGroupId: body.localeGroupId ?? null,
    status: statusPatch.status ?? body.status,
    publishedAt: statusPatch.status === 'published'
      ? (statusPatch.publishedAt ?? now)
      : (statusPatch.publishedAt ?? null),
    createdAt: now,
    updatedAt: now,
  })

  if (!category) {
    throw createApiError('INTERNAL_ERROR', 'Failed to create article category')
  }

  return { data: category }
})
