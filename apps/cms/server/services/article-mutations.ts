import type { H3Event } from 'h3'
import type { z } from 'zod'
import { createArticleSchema, updateArticleSchema } from '../utils/validations/articles'
import { slugifyString } from '../utils/slug'
import { useDb, useQueries } from '../utils/db'
import { createApiError, fromQueryError } from '../utils/errors'
import { authorshipOnCreate, authorshipOnUpdate } from '../utils/content-authorship'
import { applyContentPolicy } from '../utils/content-status-policy'
import type { Actor } from '../utils/actor'
import { actorApiKeyId, actorUserId } from '../utils/actor'
import { recordContentAudit } from './content-audit'
import {
  assertHumanReviewAllowsPublish,
  hasArticleEditorialChanges,
  nextVersionAfterHumanReviewEdit,
} from '../utils/human-review-publish'

type CreateArticleInput = z.infer<typeof createArticleSchema>
type UpdateArticleInput = z.infer<typeof updateArticleSchema>

export interface MutationMeta {
  tool?: string
}

export async function createArticleMutation(
  event: H3Event,
  actor: Actor,
  data: CreateArticleInput,
  meta?: MutationMeta,
) {
  const { articles } = useQueries(event)
  const statusPatch = applyContentPolicy(actor, null, { status: data.status })
  const status = statusPatch.status ?? 'draft'

  const baseSlug = data.slug || slugifyString(data.title)
  const slug = await articles.reserveUniqueSlug(baseSlug, data.locale || 'fr')
  const now = new Date().toISOString()
  const userId = actorUserId(actor)

  const result = await articles.insert({
    title: data.title,
    content: data.content,
    excerpt: data.excerpt,
    featured: data.featured,
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
    ...authorshipOnCreate(userId),
  })

  await recordContentAudit(useDb(event), {
    actorUserId: userId,
    actorApiKeyId: actorApiKeyId(actor),
    action: 'content.create',
    entityType: 'article',
    entityId: result.id,
    metadata: meta?.tool ? { tool: meta.tool } : null,
  })

  return result
}

export async function updateArticleMutation(
  event: H3Event,
  actor: Actor,
  id: number,
  data: UpdateArticleInput,
  meta?: MutationMeta,
) {
  const { articles } = useQueries(event)
  const existing = await articles.findRowById(id)
  if (!existing) {
    throw createApiError('NOT_FOUND', 'Article introuvable.')
  }

  const statusFields = applyContentPolicy(actor, existing, {
    status: data.status,
    scheduledAt: data.scheduledAt,
  })

  const userId = actorUserId(actor)
  const updates: Record<string, unknown> = {
    ...data,
    ...authorshipOnUpdate(userId),
    ...(data.status !== undefined
      ? {
          status: statusFields.status ?? data.status,
          publishedAt: statusFields.publishedAt,
          scheduledAt: statusFields.scheduledAt,
          firstPublishedAt: statusFields.firstPublishedAt,
        }
      : {}),
  }

  if (actor.kind === 'session') {
    const editorialChanged = hasArticleEditorialChanges(
      existing as Record<string, unknown>,
      updates,
    )
    const versionBump = nextVersionAfterHumanReviewEdit(existing, editorialChanged)
    if (versionBump !== undefined) {
      updates.version = versionBump
    }

    const nextStatus = (updates.status as string | undefined) ?? existing.status
    if (nextStatus === 'published' && existing.status !== 'published') {
      const versionForGate = (updates.version as number | undefined) ?? existing.version ?? 1
      try {
        await assertHumanReviewAllowsPublish(
          useDb(event),
          'article',
          id,
          versionForGate,
          Boolean(existing.requiresHumanReview),
        )
      }
      catch (error) {
        fromQueryError(error)
      }
    }
  }

  const result = await articles.updateById(id, updates)

  await recordContentAudit(useDb(event), {
    actorUserId: userId,
    actorApiKeyId: actorApiKeyId(actor),
    action: 'content.update',
    entityType: 'article',
    entityId: id,
    metadata: meta?.tool ? { tool: meta.tool } : null,
  })

  return result
}

export { createArticleSchema, updateArticleSchema }
