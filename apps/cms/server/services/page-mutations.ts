import type { H3Event } from 'nitro/h3'
import type { z } from 'zod'
import { createPageSchema, updatePageSchema } from '../utils/validations/pages'
import { slugifyString } from '../utils/slug'
import { useDb, useQueries } from '../utils/db'
import { createApiError } from '../utils/errors'
import { authorshipOnCreate, authorshipOnUpdate } from '../utils/content-authorship'
import { applyContentPolicy } from '../utils/content-status-policy'
import type { Actor } from '../utils/actor'
import { actorApiKeyId, actorUserId } from '../utils/actor'
import { recordContentAudit } from './content-audit'
import type { MutationMeta } from './article-mutations'

type CreatePageInput = z.infer<typeof createPageSchema>
type UpdatePageInput = z.infer<typeof updatePageSchema>

export async function createPageMutation(
  event: H3Event,
  actor: Actor,
  body: CreatePageInput,
  meta?: MutationMeta,
) {
  const { pages } = useQueries(event)
  const statusPatch = applyContentPolicy(actor, null, {
    status: body.status,
    scheduledAt: body.scheduledAt,
  })
  const status = statusPatch.status ?? 'draft'

  const baseSlug = slugifyString(body.name)
  const slug = await pages.reserveUniqueSlug(baseSlug, body.locale)
  const now = new Date().toISOString()
  const userId = actorUserId(actor)

  const page = await pages.insert({
    name: body.name,
    title: body.title ?? null,
    slug,
    content: body.content ?? null,
    excerpt: body.excerpt ?? null,
    parentId: body.parentId ?? null,
    status,
    locale: body.locale,
    localeGroupId: body.localeGroupId ?? null,
    publishedAt: status === 'published' ? (statusPatch.publishedAt ?? now) : null,
    scheduledAt: status === 'scheduled' ? (statusPatch.scheduledAt ?? null) : null,
    firstPublishedAt: status === 'published' ? (statusPatch.firstPublishedAt ?? now) : null,
    ...authorshipOnCreate(userId),
    createdAt: now,
    updatedAt: now,
  })

  if (!page) {
    throw createApiError('INTERNAL_ERROR', 'Failed to create page')
  }

  await recordContentAudit(useDb(event), {
    actorUserId: userId,
    actorApiKeyId: actorApiKeyId(actor),
    action: 'content.create',
    entityType: 'page',
    entityId: page.id,
    metadata: meta?.tool ? { tool: meta.tool } : null,
  })

  return page
}

export async function updatePageMutation(
  event: H3Event,
  actor: Actor,
  id: number,
  body: UpdatePageInput,
  meta?: MutationMeta,
) {
  const { pages } = useQueries(event)
  const existing = await pages.findRowById(id)
  if (!existing) {
    throw createApiError('NOT_FOUND', 'Page not found')
  }

  if (body.parentId !== undefined && body.parentId !== existing.parentId) {
    const cycleDetected = await pages.wouldCreateParentCycle(id, body.parentId ?? null)
    if (cycleDetected) {
      throw createApiError(
        'VALIDATION_ERROR',
        'Circular parent reference detected. A page cannot be its own ancestor.',
        { pageId: id, proposedParentId: body.parentId },
      )
    }
  }

  const statusFields = applyContentPolicy(actor, existing, {
    status: body.status,
    scheduledAt: body.scheduledAt,
  })

  const now = new Date().toISOString()
  const userId = actorUserId(actor)

  const updated = await pages.updateById(id, {
    name: body.name,
    title: body.title,
    content: body.content,
    excerpt: body.excerpt,
    parentId: body.parentId,
    locale: body.locale,
    localeGroupId: body.localeGroupId,
    ...(body.status !== undefined
      ? {
          status: statusFields.status ?? body.status,
          publishedAt: statusFields.publishedAt,
          scheduledAt: statusFields.scheduledAt,
          firstPublishedAt: statusFields.firstPublishedAt,
        }
      : {}),
    ...authorshipOnUpdate(userId),
    updatedAt: now,
  })

  if (!updated) {
    throw createApiError('INTERNAL_ERROR', 'Failed to update page')
  }

  await recordContentAudit(useDb(event), {
    actorUserId: userId,
    actorApiKeyId: actorApiKeyId(actor),
    action: 'content.update',
    entityType: 'page',
    entityId: id,
    metadata: meta?.tool ? { tool: meta.tool } : null,
  })

  return updated
}

export { createPageSchema, updatePageSchema }
