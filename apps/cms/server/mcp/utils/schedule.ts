import { actorApiKeyId, actorUserId } from '../../utils/actor'
import { useDb, useQueries } from '../../utils/db'
import { createApiError } from '../../utils/errors'
import { usePublishingService } from '../../services/publishing-service'
import { recordContentAudit } from '../../services/content-audit'
import { requireMcpScheduleTool } from './actor'
import { resolveMcpScheduledAt } from './payload'
import type { ContentWriteScope } from '../../../shared/api-keys'

/** Content types plannable via MCP — mirrors the calendar surfaces. */
type McpPlannableContentType = 'articles' | 'recipes' | 'pages'

const CONTENT_LABELS: Record<McpPlannableContentType, string> = {
  articles: 'Article',
  recipes: 'Recette',
  pages: 'Page',
}

/** Audit entityType is singular (matches content mutations + /mcp-logs links). */
const AUDIT_ENTITY_TYPES: Record<McpPlannableContentType, string> = {
  articles: 'article',
  recipes: 'recipe',
  pages: 'page',
}

const QUERIES_KEYS: Record<McpPlannableContentType, 'articles' | 'recipes' | 'pages'> = {
  articles: 'articles',
  recipes: 'recipes',
  pages: 'pages',
}

/**
 * Plan a publication via MCP (`schedule-*` tools).
 * Requires `write` + content scope + opt-in `schedule` scope on the API key.
 * The 5-min `publish-scheduled` cron does the actual publish (human-review gate applies).
 */
export async function runMcpSchedule(
  contentType: McpPlannableContentType,
  contentScope: ContentWriteScope,
  id: number,
  scheduledAt: string,
  tool: string,
) {
  const { event, actor } = requireMcpScheduleTool(contentScope)
  const iso = resolveMcpScheduledAt(scheduledAt)
  const result = await usePublishingService(event).schedule(contentType, id, iso)
  await recordContentAudit(useDb(event), {
    actorUserId: actorUserId(actor),
    actorApiKeyId: actorApiKeyId(actor),
    action: 'content.schedule',
    entityType: AUDIT_ENTITY_TYPES[contentType],
    entityId: id,
    metadata: { tool, scheduledAt: iso },
  }).catch(() => undefined)
  return result
}

/** Cancel a planned publication (`unschedule-*` tools) — scheduled → draft. */
export async function runMcpUnschedule(
  contentType: McpPlannableContentType,
  contentScope: ContentWriteScope,
  id: number,
  tool: string,
) {
  const { event, actor } = requireMcpScheduleTool(contentScope)

  const row = await useQueries(event)[QUERIES_KEYS[contentType]].findRowById(id)
  if (!row || row.deletedAt) {
    throw createApiError('NOT_FOUND', `${CONTENT_LABELS[contentType]} introuvable.`)
  }
  if (row.status === 'published') {
    throw createApiError(
      'FORBIDDEN',
      `${CONTENT_LABELS[contentType]} déjà publié — la dépublication reste manuelle (admin).`,
    )
  }
  if (row.status !== 'scheduled') {
    throw createApiError(
      'VALIDATION_ERROR',
      `${CONTENT_LABELS[contentType]} non planifié — rien à annuler.`,
    )
  }

  const result = await usePublishingService(event).unpublish(contentType, id)
  await recordContentAudit(useDb(event), {
    actorUserId: actorUserId(actor),
    actorApiKeyId: actorApiKeyId(actor),
    action: 'content.unschedule',
    entityType: AUDIT_ENTITY_TYPES[contentType],
    entityId: id,
    metadata: { tool },
  }).catch(() => undefined)
  return result
}
