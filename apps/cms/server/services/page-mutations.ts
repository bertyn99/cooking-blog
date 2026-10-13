import type { H3Event } from 'h3'
import type { z } from 'zod'
import { resolveNewPageContent } from '@journalducuistot/shared/content-blocks'
import { createPageSchema, updatePageSchema } from '../utils/validations/pages'
import type { BulkPagesInput } from '../utils/validations/content-bulk'
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
import { bulkContentMutation, recordBulkAudit } from './content-bulk-mutations'
import {
  excludeHomeRows,
  filterSelectionMoveRoots,
  partitionBulkIds,
} from '../../shared/content-bulk'

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
    content: resolveNewPageContent(body.content),
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

export async function bulkPagesMutation(
  event: H3Event,
  actor: Actor,
  input: BulkPagesInput,
) {
  if (input.action !== 'move') {
    return bulkContentMutation(event, actor, 'pages', {
      ids: input.ids,
      action: input.action,
    })
  }

  const { pages } = useQueries(event)
  const uniqueIds = [...new Set(input.ids)]
  const rows = await pages.findRowsByIds(uniqueIds)
  if (!rows.length) {
    throw createApiError('NOT_FOUND', 'Aucune page trouvée.')
  }

  const { missingIds } = partitionBulkIds(uniqueIds, rows.map(row => row.id))
  const { skippedHomeIds, workRows, workIds } = excludeHomeRows(rows)
  const userId = actorUserId(actor)
  const nesting = input.parentId != null || Boolean(input.newParentName)

  if (nesting && !workIds.length) {
    throw createApiError(
      'VALIDATION_ERROR',
      'La page d’accueil ne peut pas avoir de page parente.',
    )
  }

  const links = await pages.listParentLinks()
  const parentIdById = new Map(links.map(link => [link.id, link.parentId]))
  const moveIds = filterSelectionMoveRoots(workIds.length ? workIds : rows.map(row => row.id), parentIdById)

  if (!moveIds.length) {
    throw createApiError('VALIDATION_ERROR', 'Aucune page à déplacer.')
  }

  const locales = [...new Set(
    workRows.length ? workRows.map(row => row.locale) : rows.map(row => row.locale),
  )]
  let parentId: number | null
  let createdParentId: number | undefined

  if (input.newParentName) {
    if (locales.length > 1) {
      throw createApiError(
        'VALIDATION_ERROR',
        'Les pages sélectionnées doivent partager la même langue pour créer un parent.',
      )
    }

    const parent = await createPageMutation(event, actor, {
      name: input.newParentName,
      locale: locales[0] ?? 'fr',
      status: 'draft',
      parentId: null,
    })
    parentId = parent.id
    createdParentId = parent.id
  }
  else {
    parentId = input.parentId ?? null
  }

  if (parentId != null) {
    const parent = await pages.findRowById(parentId)
    if (!parent || parent.deletedAt) {
      throw createApiError('NOT_FOUND', 'Page parente introuvable.')
    }
    if (locales.length > 1) {
      throw createApiError(
        'VALIDATION_ERROR',
        'Les pages sélectionnées doivent partager la même langue pour changer de parent.',
      )
    }
    if (locales[0] && parent.locale !== locales[0]) {
      throw createApiError(
        'VALIDATION_ERROR',
        'Le parent doit être dans la même langue que les pages déplacées.',
      )
    }
    if (moveIds.includes(parentId)) {
      throw createApiError(
        'VALIDATION_ERROR',
        'Impossible de déplacer une page sous elle-même.',
      )
    }

    for (const id of moveIds) {
      const cycleDetected = await pages.wouldCreateParentCycle(id, parentId)
      if (cycleDetected) {
        throw createApiError(
          'VALIDATION_ERROR',
          'Une page ne peut pas être déplacée sous l’un de ses descendants.',
          { pageId: id, proposedParentId: parentId },
        )
      }
    }
  }

  await pages.updateParentIdMany(moveIds, parentId, userId)

  await recordBulkAudit(event, actor, 'page', moveIds, 'move', {
    parentId,
    ...(createdParentId != null ? { createdParentId } : {}),
    ...(skippedHomeIds.length ? { skippedHomeIds } : {}),
    ...(missingIds.length ? { missingIds } : {}),
  })

  return {
    action: 'move' as const,
    ids: moveIds,
    count: moveIds.length,
    movedIds: moveIds,
    parentId,
    ...(createdParentId != null ? { createdParentId } : {}),
    ...(skippedHomeIds.length ? { skippedHomeIds } : {}),
    ...(missingIds.length ? { missingIds } : {}),
  }
}

export { createPageSchema, updatePageSchema }
