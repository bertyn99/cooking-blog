import { validateBody } from '../../utils/validate'
import { createArticleSchema } from '../../utils/validations/articles'
import { slugifyString } from '../../utils/slug'
import { useQueries } from '../../utils/db'
import { requireEditor } from '../../utils/http-auth'
import { authorshipOnCreate } from '../../utils/content-authorship'
import { applyInitialContentStatusPolicy } from '../../utils/content-status-policy'

export default defineEventHandler(async (event) => {
  const session = await requireEditor(event)

  const body = await readBody(event)
  const data = validateBody(createArticleSchema, body)
  const { articles } = useQueries(event)

  const statusPatch = applyInitialContentStatusPolicy(session.user, {
    status: data.status,
  })
  const status = statusPatch.status ?? 'draft'

  const baseSlug = data.slug || slugifyString(data.title)
  const slug = await articles.reserveUniqueSlug(baseSlug, data.locale || 'fr')

  const now = new Date().toISOString()
  const result = await articles.insert({
    title: data.title,
    content: data.content,
    slug,
    categoryId: data.categoryId,
    coverBlobPathname: data.coverBlobPathname,
    coverAltText: data.coverAltText,
    coverDescription: data.coverDescription,
    locale: data.locale || 'fr',
    localeGroupId: data.localeGroupId,
    status,
    publishedAt: status === 'published' ? (statusPatch.publishedAt ?? now) : null,
    scheduledAt: status === 'scheduled' ? statusPatch.scheduledAt ?? null : null,
    firstPublishedAt: status === 'published' ? (statusPatch.firstPublishedAt ?? now) : null,
    ...authorshipOnCreate(session.user.id),
  })

  setResponseStatus(event, 201)
  return result
})
