import { eq } from 'drizzle-orm'
import { schema } from '../../db/create-db'
import { validateBody } from '../../utils/validate'
import { createArticleSchema } from '../../utils/validations/articles'
import { slugifyString, generateUniqueSlug } from '../../utils/slug'
import { canEditContent } from '../../../shared/abilities'
import { useDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  await authorize(event, canEditContent)

  const body = await readBody(event)
  const data = validateBody(createArticleSchema, body)
  const db = useDb(event)

  const baseSlug = data.slug || slugifyString(data.title)
  const existing = await db.select({ slug: schema.articles.slug })
    .from(schema.articles)
    .where(eq(schema.articles.locale, data.locale || 'fr'))
    .all()
  const slug = generateUniqueSlug(baseSlug, existing.map(r => r.slug))

  const result = await db.insert(schema.articles).values({
    title: data.title,
    content: data.content,
    slug,
    categoryId: data.categoryId,
    coverBlobPathname: data.coverBlobPathname,
    locale: data.locale || 'fr',
    localeGroupId: data.localeGroupId,
    status: 'draft',
  }).returning().get()

  setResponseStatus(event, 201)
  return result
})
