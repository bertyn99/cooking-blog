/**
 * POST /api/category-articles — Create a new article category.
 *
 * Auth required (enforced by middleware).
 *
 * Body:
 * - name          (string, required)
 * - locale        (string, default: 'fr')
 * - localeGroupId (string, optional)
 * - status        (enum, default: 'published')
 * - publishedAt   (string, optional — auto-set when status is 'published')
 *
 * The slug is auto-generated from name via slugifyString().
 * Checks for slug uniqueness within the same locale.
 */
import { db, schema } from 'hub:db'
import { eq, and } from 'drizzle-orm'
import { createArticleCategorySchema } from '../../utils/validations/categories'
import { validateBody } from '../../utils/validate'
import { createApiError } from '../../utils/errors'
import { slugifyString } from '../../utils/slug'

export default defineEventHandler(async (event) => {
  const body = validateBody(createArticleCategorySchema, await readBody(event))

  // Generate slug from name
  const baseSlug = slugifyString(body.name)

  // Check for existing slugs within the same locale, append suffix if needed
  let slug = baseSlug
  let counter = 2
  while (true) {
    const existing = await db
      .select({ id: schema.categoryArticles.id })
      .from(schema.categoryArticles)
      .where(
        and(
          eq(schema.categoryArticles.slug, slug),
          eq(schema.categoryArticles.locale, body.locale),
        ),
      )
      .limit(1)
      .all()

    if (existing.length === 0) break
    slug = `${baseSlug}-${counter}`
    counter++
  }

  const now = new Date().toISOString()

  const rows = await db
    .insert(schema.categoryArticles)
    .values({
      name: body.name,
      slug,
      locale: body.locale,
      localeGroupId: body.localeGroupId ?? null,
      status: body.status,
      publishedAt: body.status === 'published'
        ? (body.publishedAt ?? now)
        : (body.publishedAt ?? null),
      createdAt: now,
      updatedAt: now,
    })
    .returning()
    .all()

  const category = rows[0]
  if (!category) {
    throw createApiError('INTERNAL_ERROR', 'Failed to create article category')
  }

  return { data: category }
})
