import type { AppDb } from '../db/create-db'
import { schema } from '../db/create-db'

export type ContentAuditAction = 'content.create' | 'content.update' | 'mcp.tool'

export async function recordContentAudit(
  db: AppDb,
  input: {
    actorUserId: number
    actorApiKeyId?: number | null
    action: ContentAuditAction
    entityType: string
    entityId: string | number
    metadata?: Record<string, unknown> | null
    correlationId?: string | null
  },
) {
  await db.insert(schema.auditEvents).values({
    actorUserId: input.actorUserId,
    actorApiKeyId: input.actorApiKeyId ?? null,
    action: input.action,
    entityType: input.entityType,
    entityId: String(input.entityId),
    metadata: input.metadata ?? null,
    correlationId: input.correlationId ?? null,
  })
}
