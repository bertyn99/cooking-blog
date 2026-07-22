import { validateBody } from '../../utils/validate'
import { createArticleSchema } from '../../utils/validations/articles'
import { slugifyString } from '../../utils/slug'
import { canEditContent } from '../../../shared/abilities'
import { useQueries } from '../../utils/db'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  await authorize(event, canEditContent)

  const body = await readBody(event)
  const data = validateBody(createArticleSchema, body)
  const { articles } = useQueries(event)

  const baseSlug = data.slug || slugifyString(data.title)
  const slug = await articles.reserveUniqueSlug(baseSlug, data.locale || 'fr')

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
    status: 'draft',
  })

  setResponseStatus(event, 201)
  return result
})
