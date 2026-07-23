import { createPageSchema } from '../../utils/validations/pages'
import { validateBody } from '../../utils/validate'
import { createApiError } from '../../utils/errors'
import { slugifyString } from '../../utils/slug'
import { useQueries } from '../../utils/db'
import { requireEditor } from '../../utils/http-auth'
import { authorshipOnCreate } from '../../utils/content-authorship'
import { applyInitialContentStatusPolicy } from '../../utils/content-status-policy'

export default defineEventHandler(async (event) => {
  const session = await requireEditor(event)

  const body = validateBody(createPageSchema, await readBody(event))
  const { pages } = useQueries(event)

  const statusPatch = applyInitialContentStatusPolicy(session.user, {
    status: body.status,
    scheduledAt: body.scheduledAt,
  })
  const status = statusPatch.status ?? 'draft'

  const baseSlug = slugifyString(body.name)
  const slug = await pages.reserveUniqueSlug(baseSlug, body.locale)
  const now = new Date().toISOString()

  const page = await pages.insert({
    name: body.name,
    title: body.title ?? null,
    slug,
    content: body.content ?? null,
    parentId: body.parentId ?? null,
    status,
    locale: body.locale,
    localeGroupId: body.localeGroupId ?? null,
    publishedAt: status === 'published' ? (statusPatch.publishedAt ?? now) : null,
    scheduledAt: status === 'scheduled' ? (statusPatch.scheduledAt ?? null) : null,
    firstPublishedAt: status === 'published' ? (statusPatch.firstPublishedAt ?? now) : null,
    ...authorshipOnCreate(session.user.id),
    createdAt: now,
    updatedAt: now,
  })

  if (!page) {
    throw createApiError('INTERNAL_ERROR', 'Failed to create page')
  }

  return { data: page }
})
