/**
 * POST /api/categories — Create a new recipe category.
 *
 * Auth required (enforced by middleware).
 *
 * Body:
 * - name          (string, required)
 * - desc          (string, optional)
 * - locale        (string, default: 'fr')
 * - localeGroupId (string, optional)
 * - status        (enum, default: 'published')
 * - publishedAt   (string, optional — auto-set when status is 'published')
 *
 * The slug is auto-generated from name via slugifyString().
 * Checks for slug uniqueness within the same locale.
 */
import { eq, and } from 'drizzle-orm'
import { schema } from '../../db/create-db'
import { createRecipeCategorySchema } from '../../utils/validations/categories'
import { validateBody } from '../../utils/validate'
import { createApiError } from '../../utils/errors'
import { slugifyString } from '../../utils/slug'
import { canEditContent } from '../../../shared/abilities'
import { useDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  await authorize(event, canEditContent)

  const body = validateBody(createRecipeCategorySchema, await readBody(event))
  const db = useDb(event)

  // Generate slug from name
  const baseSlug = slugifyString(body.name)

  // Check for existing slugs within the same locale, append suffix if needed
  let slug = baseSlug
  let counter = 2
  while (true) {
    const existing = await db
      .select({ id: schema.categories.id })
      .from(schema.categories)
      .where(
        and(
          eq(schema.categories.slug, slug),
          eq(schema.categories.locale, body.locale),
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
    .insert(schema.categories)
    .values({
      name: body.name,
      desc: body.desc ?? null,
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
    throw createApiError('INTERNAL_ERROR', 'Failed to create category')
  }

  return { data: category }
})
