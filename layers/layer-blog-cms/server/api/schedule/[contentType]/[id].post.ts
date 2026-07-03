import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'

const TABLES: Record<string, any> = {
  articles: schema.articles,
  recipes: schema.recipes,
  pages: schema.pages,
  categories: schema.categories,
  'category-articles': schema.categoryArticles,
}

export default defineEventHandler(async (event) => {
  const contentType = getRouterParam(event, 'contentType') || ''
  const id = parseInt(getRouterParam(event, 'id') || '')
  if (isNaN(id)) throw createError({ statusCode: 404 })

  const table = TABLES[contentType]
  if (!table) throw createError({ statusCode: 400, statusMessage: `Unknown content type: ${contentType}` })

  const body = await readBody(event)
  const date = body.date
  if (!date) throw createError({ statusCode: 400, statusMessage: 'date is required' })

  await db.update(table)
    .set({ status: 'scheduled', scheduledAt: date })
    .where(eq(table.id, id))

  return { status: 'scheduled', scheduledAt: date }
})
