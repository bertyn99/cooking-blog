import { z } from 'zod'
import type { H3Event } from 'h3'
import { createApiError, fromQueryError } from '../utils/errors'
import { useDb, useQueries } from '../utils/db'
import type { SeoContentType } from '../db/queries/seo'
import type { Actor } from '../utils/actor'
import { actorApiKeyId, actorUserId } from '../utils/actor'
import { applyApiKeyDraftPolicy } from '../utils/content-status-policy'
import { recordContentAudit } from './content-audit'
import type { MutationMeta } from './article-mutations'

const socialMetaSchema = z.object({
  socialNetwork: z.enum(['Facebook', 'Twitter']),
  title: z.string().optional(),
  description: z.string().optional(),
  imageBlobPathname: z.string().optional(),
})

export const seoBodySchema = z.object({
  description: z.string().optional(),
  keywords: z.string().optional(),
  canonicalUrl: z.string().url().optional().or(z.literal('')),
  metaRobots: z.string().optional(),
  socialMeta: z.array(socialMetaSchema).optional(),
})

const VALID_CONTENT_TYPES = new Set(['article', 'recipe', 'page'])

async function assertSeoTargetDraft(
  event: H3Event,
  actor: Actor,
  contentType: SeoContentType,
  contentId: number,
) {
  if (actor.kind !== 'apiKey') return

  const queries = useQueries(event)
  if (contentType === 'article') {
    const row = await queries.articles.findRowById(contentId)
    if (!row) throw createApiError('NOT_FOUND', 'Article introuvable.')
    applyApiKeyDraftPolicy(row, {})
    return
  }
  if (contentType === 'recipe') {
    const row = await queries.recipes.findRowById(contentId)
    if (!row) throw createApiError('NOT_FOUND', 'Recette introuvable.')
    applyApiKeyDraftPolicy(row, {})
    return
  }
  const row = await queries.pages.findRowById(contentId)
  if (!row) throw createApiError('NOT_FOUND', 'Page not found')
  applyApiKeyDraftPolicy(row, {})
}

export async function upsertSeoMutation(
  event: H3Event,
  actor: Actor,
  contentType: SeoContentType,
  contentId: number,
  body: z.infer<typeof seoBodySchema>,
  meta?: MutationMeta,
) {
  if (!VALID_CONTENT_TYPES.has(contentType)) {
    throw createApiError(
      'VALIDATION_ERROR',
      `Invalid contentType. Must be one of: ${[...VALID_CONTENT_TYPES].join(', ')}`,
    )
  }

  await assertSeoTargetDraft(event, actor, contentType, contentId)

  try {
    const seo = await useQueries(event).seo.upsertForContent(contentType, contentId, body)

    await recordContentAudit(useDb(event), {
      actorUserId: actorUserId(actor),
      actorApiKeyId: actorApiKeyId(actor),
      action: 'content.update',
      entityType: contentType,
      entityId: contentId,
      metadata: { ...(meta?.tool ? { tool: meta.tool } : {}), scope: 'seo' },
    })

    return seo
  }
  catch (error) {
    fromQueryError(error)
  }
}
