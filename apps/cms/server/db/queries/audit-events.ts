import { and, desc, eq, gte, isNotNull, lte, sql } from 'drizzle-orm'
import type { AppDb } from '../create-db'
import { schema } from '../create-db'

export function createAuditEventQueries(db: AppDb) {
  return {
    async listMcpLogs(options: {
      page: number
      pageSize: number
      action?: string
      entityType?: string
      keyPrefix?: string
      from?: string
      to?: string
    }) {
      const offset = (options.page - 1) * options.pageSize
      const conditions = [isNotNull(schema.auditEvents.actorApiKeyId)]

      if (options.action) {
        conditions.push(eq(schema.auditEvents.action, options.action))
      }
      if (options.entityType) {
        conditions.push(eq(schema.auditEvents.entityType, options.entityType))
      }
      if (options.from) {
        conditions.push(gte(schema.auditEvents.createdAt, options.from))
      }
      if (options.to) {
        conditions.push(lte(schema.auditEvents.createdAt, options.to))
      }
      if (options.keyPrefix) {
        conditions.push(sql`exists (
          select 1 from ${schema.apiKeys}
          where ${schema.apiKeys.id} = ${schema.auditEvents.actorApiKeyId}
          and ${schema.apiKeys.keyPrefix} like ${`${options.keyPrefix}%`}
        )`)
      }

      const where = and(...conditions)

      const [totalRow] = await db
        .select({ value: sql<number>`count(*)` })
        .from(schema.auditEvents)
        .where(where)

      const total = Number(totalRow?.value ?? 0)

      const rows = await db
        .select({
          id: schema.auditEvents.id,
          action: schema.auditEvents.action,
          entityType: schema.auditEvents.entityType,
          entityId: schema.auditEvents.entityId,
          metadata: schema.auditEvents.metadata,
          createdAt: schema.auditEvents.createdAt,
          actorUserId: schema.auditEvents.actorUserId,
          actorApiKeyId: schema.auditEvents.actorApiKeyId,
          keyPrefix: schema.apiKeys.keyPrefix,
          keyName: schema.apiKeys.name,
        })
        .from(schema.auditEvents)
        .leftJoin(schema.apiKeys, eq(schema.auditEvents.actorApiKeyId, schema.apiKeys.id))
        .where(where)
        .orderBy(desc(schema.auditEvents.createdAt))
        .limit(options.pageSize)
        .offset(offset)

      return {
        data: rows,
        meta: {
          pagination: {
            page: options.page,
            pageSize: options.pageSize,
            total,
            pageCount: Math.max(1, Math.ceil(total / options.pageSize)),
          },
        },
      }
    },
  }
}
