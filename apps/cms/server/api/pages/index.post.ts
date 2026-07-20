/**
 * POST /api/pages — Create a new page.
 *
 * Auth required (enforced by middleware).
 *
 * Body:
 * - name          (string, required)
 * - title         (string, optional)
 * - content       (string, optional)
 * - parentId      (number | null, optional)
 * - locale        (string, default: 'fr')
 * - localeGroupId (string, optional)
 *
 * The slug is auto-generated from name.
 * Checks for slug uniqueness within the same locale.
 */
import { eq, and } from 'drizzle-orm'
import { pages } from '../../db/schema/pages'
import { createPageSchema } from '../../utils/validations/pages'
import { validateBody } from '../../utils/validate'
import { createApiError } from '../../utils/errors'
import { slugifyString } from '../../utils/slug'
import { canEditContent } from '../../../shared/abilities'
import { useDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  await authorize(event, canEditContent)

  const body = validateBody(createPageSchema, await readBody(event))
  const db = useDb(event)

  // Generate slug from name
  const baseSlug = slugifyString(body.name)

  // Check for existing slugs within the same locale, incrementally append suffix
  let slug = baseSlug
  let counter = 2
  while (true) {
    const existing = await db
      .select({ id: pages.id })
      .from(pages)
      .where(
        and(
          eq(pages.slug, slug),
          eq(pages.locale, body.locale),
        ),
      )
      .limit(1)

    if (existing.length === 0) break
    slug = `${baseSlug}-${counter}`
    counter++
  }

  const now = new Date().toISOString()

  const rows = await db
    .insert(pages)
    .values({
      name: body.name,
      title: body.title ?? null,
      slug,
      content: body.content ?? null,
      parentId: body.parentId ?? null,
      status: 'published',
      locale: body.locale,
      localeGroupId: body.localeGroupId ?? null,
      publishedAt: now,
      createdAt: now,
      updatedAt: now,
    })
    .returning()

  const page = rows[0]
  if (!page) {
    throw createApiError('INTERNAL_ERROR', 'Failed to create page')
  }

  return { data: page }
})
