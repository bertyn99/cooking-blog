/**
 * PUT /api/seo/:contentType/:contentId
 *
 * Creates or updates (upserts) SEO metadata for a content item.
 * Replaces all socialMeta entries with the provided array.
 *
 * Auth required (enforced by middleware).
 *
 * Body:
 *   description?: string
 *   keywords?: string
 *   metaRobots?: string
 *   socialMeta?: Array<{
 *     socialNetwork: 'Facebook' | 'Twitter'
 *     title?: string
 *     description?: string
 *     imageBlobPathname?: string
 *   }>
 *
 * Response:
 * - 200 { data: { seo } } (with nested socialMeta)
 * - 400 if contentType or contentId is invalid, or body validation fails
 */
import { eq } from 'drizzle-orm'
import { schema } from '../../../db/create-db'
import { z } from 'zod'
import { createApiError } from '../../../utils/errors'
import { canEditContent } from '../../../../shared/abilities'
import { getSeoFilter } from '../../../utils/seo'
import { useDb } from '../../../utils/db'

// ---------------------------------------------------------------------------
// Validation schemas
// ---------------------------------------------------------------------------

const socialMetaSchema = z.object({
  socialNetwork: z.enum(['Facebook', 'Twitter']),
  title: z.string().optional(),
  description: z.string().optional(),
  imageBlobPathname: z.string().optional(),
})

const seoBodySchema = z.object({
  description: z.string().optional(),
  keywords: z.string().optional(),
  metaRobots: z.string().optional(),
  socialMeta: z.array(socialMetaSchema).optional(),
})

type SeoBody = z.infer<typeof seoBodySchema>
type SocialMetaEntry = z.infer<typeof socialMetaSchema>

// ---------------------------------------------------------------------------
// Content type helpers
// ---------------------------------------------------------------------------

const VALID_CONTENT_TYPES = new Set(['article', 'recipe', 'page'])

type ContentType = 'article' | 'recipe' | 'page'

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  await authorize(event, canEditContent)

  const contentType = getRouterParam(event, 'contentType') as ContentType
  const contentId = Number(getRouterParam(event, 'contentId'))

  if (!contentType || !VALID_CONTENT_TYPES.has(contentType)) {
    throw createApiError(
      'VALIDATION_ERROR',
      `Invalid contentType. Must be one of: ${[...VALID_CONTENT_TYPES].join(', ')}`
    )
  }

  if (!Number.isFinite(contentId) || contentId < 1) {
    throw createApiError('VALIDATION_ERROR', 'Invalid contentId')
  }

  // Validate body
  const rawBody = await readBody(event)
  const parseResult = seoBodySchema.safeParse(rawBody)
  if (!parseResult.success) {
    throw createApiError(
      'VALIDATION_ERROR',
      'Invalid request body',
      parseResult.error.flatten()
    )
  }
  const body: SeoBody = parseResult.data

  const db = useDb(event)
  const filter = getSeoFilter(contentType, contentId)

  // Upsert SEO record + replace socialMeta in a transaction
  const result = await db.transaction(async (tx) => {
    // Find existing SEO record
    const existing = await tx
      .select({ id: schema.seo.id })
      .from(schema.seo)
      .where(filter)
      .limit(1)
      .all()

    let seoId: number

    if (existing.length > 0) {
      // Update existing
      seoId = existing[0]!.id
      await tx
        .update(schema.seo)
        .set({
          description: body.description !== undefined ? body.description : undefined,
          keywords: body.keywords !== undefined ? body.keywords : undefined,
          metaRobots: body.metaRobots !== undefined ? body.metaRobots : undefined,
        })
        .where(eq(schema.seo.id, seoId))
    } else {
      // Insert new — set all FKs, only the correct one gets a value
      const insertResult = await tx
        .insert(schema.seo)
        .values({
          articleId: contentType === 'article' ? contentId : null,
          recipeId: contentType === 'recipe' ? contentId : null,
          pageId: contentType === 'page' ? contentId : null,
          description: body.description ?? null,
          keywords: body.keywords ?? null,
          metaRobots: body.metaRobots ?? null,
        })
        .returning({ id: schema.seo.id })
        .all()

      const inserted = insertResult[0]
      if (!inserted) {
        tx.rollback()
        throw createApiError('INTERNAL_ERROR', 'Failed to create SEO record')
      }
      seoId = inserted.id
    }

    // Replace socialMeta if provided
    if (body.socialMeta !== undefined) {
      // Delete all existing socialMeta for this seoId
      await tx
        .delete(schema.socialMeta)
        .where(eq(schema.socialMeta.seoId, seoId))

      // Insert new socialMeta entries
      if (body.socialMeta.length > 0) {
        await tx.insert(schema.socialMeta).values(
          body.socialMeta.map((sm: SocialMetaEntry) => ({
            seoId,
            socialNetwork: sm.socialNetwork,
            title: sm.title ?? null,
            description: sm.description ?? null,
            imageBlobPathname: sm.imageBlobPathname ?? null,
          }))
        )
      }
    }

    return seoId
  })

  // Fetch and return the fresh record with socialMeta
  const seo = await db.query.seo.findFirst({
    where: { id: result },
    with: { socialMeta: true },
  })

  if (!seo) {
    throw createApiError('INTERNAL_ERROR', 'Failed to retrieve created/updated SEO record')
  }

  return { data: seo }
})
