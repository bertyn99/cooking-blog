import { and, eq, sql } from 'drizzle-orm'
import type { AppDb } from '../create-db'
import { schema } from '../create-db'

export function createLegacyStrapiMapQueries(db: AppDb) {
  return {
    async findDestId(sourceType: string, sourceId: string): Promise<string | null> {
      const row = await db
        .select({ destId: schema.legacyStrapiMap.destId })
        .from(schema.legacyStrapiMap)
        .where(and(
          eq(schema.legacyStrapiMap.sourceType, sourceType),
          eq(schema.legacyStrapiMap.sourceId, sourceId),
        ))
        .get()

      return row?.destId ?? null
    },

    async upsert(
      input: {
        sourceType: string
        sourceId: string
        destTable: string
        destId: string | number
      },
      dryRun: boolean,
    ) {
      if (dryRun) return

      const destId = String(input.destId)
      const existing = await db
        .select({ destId: schema.legacyStrapiMap.destId })
        .from(schema.legacyStrapiMap)
        .where(and(
          eq(schema.legacyStrapiMap.sourceType, input.sourceType),
          eq(schema.legacyStrapiMap.sourceId, input.sourceId),
        ))
        .get()
        .then(row => row?.destId ?? null)

      if (existing) {
        await db
          .update(schema.legacyStrapiMap)
          .set({ destTable: input.destTable, destId })
          .where(and(
            eq(schema.legacyStrapiMap.sourceType, input.sourceType),
            eq(schema.legacyStrapiMap.sourceId, input.sourceId),
          ))
        return
      }

      await db.insert(schema.legacyStrapiMap).values({
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        destTable: input.destTable,
        destId,
      })
    },

    async countBySourceType(sourceType: string): Promise<number> {
      const row = await db
        .select({ count: sql<number>`count(*)` })
        .from(schema.legacyStrapiMap)
        .where(eq(schema.legacyStrapiMap.sourceType, sourceType))
        .get()
      return row?.count ?? 0
    },
  }
}
