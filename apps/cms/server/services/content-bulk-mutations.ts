import type { H3Event } from 'h3'
import type { Actor } from '../utils/actor'
import { actorApiKeyId, actorUserId } from '../utils/actor'
import { useDb, useQueries } from '../utils/db'
import { createApiError } from '../utils/errors'
import { applyContentPolicy } from '../utils/content-status-policy'
import type { PublishableContentType } from '../utils/content-types'
import { isQueryError } from '../db/query-errors'
import type { BulkContentInput } from '../utils/validations/content-bulk'
import {
  excludeHomeRows,
  partitionBulkIds,
  type BulkItemFailure,
  type BulkMutationResult,
} from '../../shared/content-bulk'
import { recordContentAudit } from './content-audit'
import { usePublishingService } from './publishing-service'

export type BulkContentKind = 'articles' | 'recipes' | 'pages'

const KIND_META: Record<BulkContentKind, {
  entityType: string
  notFound: string
  publishingType: PublishableContentType
}> = {
  articles: {
    entityType: 'article',
    notFound: 'Aucun article trouvé.',
    publishingType: 'articles',
  },
  recipes: {
    entityType: 'recipe',
    notFound: 'Aucune recette trouvée.',
    publishingType: 'recipes',
  },
  pages: {
    entityType: 'page',
    notFound: 'Aucune page trouvée.',
    publishingType: 'pages',
  },
}

function collectionForKind(event: H3Event, kind: BulkContentKind) {
  const queries = useQueries(event)
  switch (kind) {
    case 'articles':
      return queries.articles
    case 'recipes':
      return queries.recipes
    case 'pages':
      return queries.pages
    default: {
      const _exhaustive: never = kind
      throw createApiError('VALIDATION_ERROR', `Type inconnu : ${String(_exhaustive)}`)
    }
  }
}

export function bulkItemErrorMessage(error: unknown): string {
  if (isQueryError(error)) return error.message
  if (error && typeof error === 'object') {
    const payload = error as {
      statusMessage?: string
      message?: string
      data?: { error?: { message?: string }, message?: string }
    }
    if (payload.data?.error?.message) return payload.data.error.message
    if (typeof payload.data?.message === 'string' && payload.data.message) return payload.data.message
    if (payload.statusMessage) return payload.statusMessage
    if (payload.message) return payload.message
  }
  return 'Action impossible'
}

export async function runBulkPerId(
  ids: number[],
  run: (id: number) => Promise<void>,
): Promise<{ succeeded: number[], failed: BulkItemFailure[] }> {
  const succeeded: number[] = []
  const failed: BulkItemFailure[] = []
  for (const id of ids) {
    try {
      await run(id)
      succeeded.push(id)
    }
    catch (error) {
      failed.push({ id, message: bulkItemErrorMessage(error) })
    }
  }
  return { succeeded, failed }
}

export async function recordBulkAudit(
  event: H3Event,
  actor: Actor,
  entityType: string,
  ids: number[],
  action: string,
  extra?: Record<string, unknown>,
) {
  if (!ids.length) return
  await recordContentAudit(useDb(event), {
    actorUserId: actorUserId(actor),
    actorApiKeyId: actorApiKeyId(actor),
    action: 'content.update',
    entityType,
    entityId: ids[0]!,
    metadata: {
      bulk: true,
      bulkAction: action,
      ids,
      count: ids.length,
      ...extra,
    },
  })
}

export async function bulkContentMutation(
  event: H3Event,
  actor: Actor,
  kind: BulkContentKind,
  input: BulkContentInput,
): Promise<BulkMutationResult> {
  const collection = collectionForKind(event, kind)
  const uniqueIds = [...new Set(input.ids)]
  const rows = await collection.findRowsByIds(uniqueIds)
  if (!rows.length) {
    throw createApiError('NOT_FOUND', KIND_META[kind].notFound)
  }

  const { missingIds } = partitionBulkIds(uniqueIds, rows.map(row => row.id))
  const userId = actorUserId(actor)
  const meta = KIND_META[kind]

  let skippedHomeIds: number[] = []
  let workIds = rows.map(row => row.id)
  if (input.action === 'delete' && kind === 'pages') {
    const excluded = excludeHomeRows(rows)
    skippedHomeIds = excluded.skippedHomeIds
    workIds = excluded.workIds
    if (!workIds.length) {
      throw createApiError(
        'VALIDATION_ERROR',
        'Impossible de supprimer la page d’accueil. Désignez une autre page d’accueil d’abord.',
      )
    }
  }

  let actedIds = workIds
  let failed: BulkItemFailure[] = []

  switch (input.action) {
    case 'delete':
      await collection.softDeleteMany(workIds, userId)
      break
    case 'publish': {
      applyContentPolicy(actor, { status: 'draft' }, { status: 'published' })
      const publishing = usePublishingService(event)
      const result = await runBulkPerId(workIds, id =>
        publishing.publish(meta.publishingType, id, { actorUserId: userId }).then(() => undefined),
      )
      actedIds = result.succeeded
      failed = result.failed
      break
    }
    case 'unpublish': {
      applyContentPolicy(actor, { status: 'published' }, { status: 'draft' })
      const publishing = usePublishingService(event)
      const result = await runBulkPerId(workIds, id =>
        publishing.unpublish(meta.publishingType, id).then(() => undefined),
      )
      actedIds = result.succeeded
      failed = result.failed
      break
    }
    default: {
      const _exhaustive: never = input.action
      throw createApiError('VALIDATION_ERROR', `Action inconnue : ${String(_exhaustive)}`)
    }
  }

  if (!actedIds.length) {
    throw createApiError(
      failed[0] ? 'CONFLICT' : 'VALIDATION_ERROR',
      failed[0]?.message ?? KIND_META[kind].notFound,
      failed.length ? { failed } : undefined,
    )
  }

  await recordBulkAudit(event, actor, meta.entityType, actedIds, input.action, {
    ...(failed.length ? { failed } : {}),
    ...(skippedHomeIds.length ? { skippedHomeIds } : {}),
    ...(missingIds.length ? { missingIds } : {}),
  })

  return {
    action: input.action,
    ids: actedIds,
    count: actedIds.length,
    ...(failed.length ? { failed } : {}),
    ...(skippedHomeIds.length ? { skippedHomeIds } : {}),
    ...(missingIds.length ? { missingIds } : {}),
  }
}
