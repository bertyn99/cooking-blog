import { and, eq } from 'drizzle-orm'
import type { AppDb } from '../../db/create-db'
import { schema } from '../../db/create-db'

export async function findLegacyDestId(
  db: AppDb,
  sourceType: string,
  sourceId: string,
): Promise<string | null> {
  const row = await db
    .select({ destId: schema.legacyStrapiMap.destId })
    .from(schema.legacyStrapiMap)
    .where(and(
      eq(schema.legacyStrapiMap.sourceType, sourceType),
      eq(schema.legacyStrapiMap.sourceId, sourceId),
    ))
    .get()

  return row?.destId ?? null
}

export async function upsertLegacyMap(
  db: AppDb,
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
  const existing = await findLegacyDestId(db, input.sourceType, input.sourceId)

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
}
