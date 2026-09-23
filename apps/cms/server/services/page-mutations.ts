import type { H3Event } from 'h3'
import type { z } from 'zod'
import { createPageSchema, updatePageSchema } from '../utils/validations/pages'
import { slugifyString } from '../utils/slug'
import { useDb, useQueries } from '../utils/db'
import { createApiError, fromQueryError } from '../utils/errors'
import {
  isPageHomeUniqueConstraint,
  isPageSlugUniqueConstraint,
} from '../utils/sqlite-constraint'
import { authorshipOnCreate, authorshipOnUpdate } from '../utils/content-authorship'
import { applyContentPolicy } from '../utils/content-status-policy'
import type { Actor } from '../utils/actor'
import { actorApiKeyId, actorUserId } from '../utils/actor'
import { recordContentAudit } from './content-audit'
import type { MutationMeta } from './article-mutations'

type CreatePageInput = z.infer<typeof createPageSchema>
type UpdatePageInput = z.infer<typeof updatePageSchema>

function assertHomePageRules(isHome: boolean | undefined, parentId: number | null | undefined) {
  if (!isHome) return
  if (parentId != null) {
    throw createApiError(
      'VALIDATION_ERROR',
      'La page d’accueil ne peut pas avoir de page parente.',
    )
  }
}

function mapPageUniqueConstraint(error: unknown): never {
  if (isPageHomeUniqueConstraint(error)) {
    throw createApiError('CONFLICT', 'Une page d’accueil existe déjà pour cette langue.')
  }
  if (isPageSlugUniqueConstraint(error)) {
    throw createApiError('CONFLICT', 'Une page avec ce slug existe déjà pour cette langue.')
  }
  fromQueryError(error)
}

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

  assertHomePageRules(body.isHome, body.parentId ?? null)

  const baseSlug = slugifyString(body.name)
  const slug = await pages.reserveUniqueSlug(baseSlug, body.locale)
  const now = new Date().toISOString()
  const userId = actorUserId(actor)

  const values = {
    name: body.name,
    title: body.title ?? null,
    slug,
    content: body.content ?? null,
    excerpt: body.excerpt ?? null,
    parentId: body.isHome ? null : (body.parentId ?? null),
    isHome: body.isHome ?? false,
    status,
    locale: body.locale,
    localeGroupId: body.localeGroupId ?? null,
    publishedAt: status === 'published' ? (statusPatch.publishedAt ?? now) : null,
    scheduledAt: status === 'scheduled' ? (statusPatch.scheduledAt ?? null) : null,
    firstPublishedAt: status === 'published' ? (statusPatch.firstPublishedAt ?? now) : null,
    ...authorshipOnCreate(userId),
    createdAt: now,
    updatedAt: now,
  }

  let page
  try {
    page = body.isHome
      ? await pages.insertAsHome(values)
      : await pages.insert(values)
  }
  catch (error) {
    mapPageUniqueConstraint(error)
  }

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

  const statusFields = applyContentPolicy(
    actor,
    existing,
    {
      status: body.status,
      scheduledAt: body.scheduledAt,
    },
    { apiKeyMode: 'in-place' },
  )

  const nextParentId = body.parentId !== undefined ? body.parentId : existing.parentId
  const nextIsHome = body.isHome !== undefined ? body.isHome : existing.isHome
  assertHomePageRules(nextIsHome ? true : undefined, nextParentId ?? null)

  if (existing.isHome && body.isHome === false) {
    throw createApiError(
      'VALIDATION_ERROR',
      'Désignez une autre page d’accueil d’abord.',
    )
  }

  const now = new Date().toISOString()
  const userId = actorUserId(actor)
  const locale = body.locale ?? existing.locale
  const patch = {
    name: body.name,
    title: body.title,
    content: body.content,
    excerpt: body.excerpt,
    parentId: nextIsHome ? null : body.parentId,
    isHome: body.isHome,
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
  }

  let updated
  try {
    updated = nextIsHome
      ? await pages.updateAsHome(id, locale, patch)
      : await pages.updateById(id, patch)
  }
  catch (error) {
    mapPageUniqueConstraint(error)
  }

  if (!updated) {
    throw createApiError('NOT_FOUND', 'Page not found')
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
