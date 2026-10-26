import type { BatchItem } from 'drizzle-orm'
import type { AppDb } from '../create-db'
import { schema } from '../create-db'
import type { PublishableContentType } from '../../utils/content-types'

export type RevisionReason = typeof schema.contentRevisions.$inferInsert.reason

export interface PublishSnapshotInput {
  contentType: PublishableContentType
  contentId: number
  snapshot: Record<string, unknown>
  version: number
  actorUserId?: number | null
}

/** D1-safe statements for a publish snapshot + audit row. Pair with other writes via `db.batch`. */
export function publishSnapshotBatchItems(
  db: Pick<AppDb, 'insert'>,
  input: PublishSnapshotInput,
): BatchItem<'sqlite'>[] {
  return [
    db.insert(schema.contentRevisions).values({
      contentType: input.contentType,
      contentId: input.contentId,
      version: input.version,
      snapshot: input.snapshot,
      reason: 'publish',
      createdByUserId: input.actorUserId ?? null,
    }),
    db.insert(schema.auditEvents).values({
      actorUserId: input.actorUserId ?? null,
      action: 'content.publish',
      entityType: input.contentType,
      entityId: String(input.contentId),
      metadata: { version: input.version },
    }),
  ]
}

export function createContentRevisionQueries(db: AppDb) {
  return {
    async insertRevision(input: {
      contentType: PublishableContentType
      contentId: number
      version: number
      snapshot: Record<string, unknown>
      reason: RevisionReason
      createdByUserId?: number | null
    }) {
      await db.insert(schema.contentRevisions).values({
        contentType: input.contentType,
        contentId: input.contentId,
        version: input.version,
        snapshot: input.snapshot,
        reason: input.reason,
        createdByUserId: input.createdByUserId ?? null,
      })
    },

    async recordPublishSnapshot(input: PublishSnapshotInput) {
      await db.batch(publishSnapshotBatchItems(db, input))
    },
  }
}
