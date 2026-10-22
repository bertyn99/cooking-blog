import type { H3Event } from 'h3'
import type { PublishActorContext } from '../db/queries/publishing'
import { createPublishingQueries } from '../db/queries/publishing'
import type { AppDb } from '../db/create-db'
import type { PublishableContentType } from '../utils/content-types'
import { isPublishableContentType } from '../utils/content-types'
import { fromQueryError } from '../utils/errors'
import { queryValidation } from '../db/query-errors'
import { useDb } from '../utils/db'
import { pingIndexNow } from '../utils/indexnow'

function parsePublishableContentType(contentType: string): PublishableContentType {
  if (!isPublishableContentType(contentType)) {
    throw queryValidation(`Unknown content type: ${contentType}`)
  }
  return contentType
}

async function mapQueryErrors<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn()
  }
  catch (error) {
    fromQueryError(error)
  }
}

/** Publishing workflow — delegates all persistence to `db/queries/publishing`. */
export function createPublishingService(db: AppDb) {
  const publishing = createPublishingQueries(db)

  /** Best-effort search-engine discovery ping — never blocks or fails a publish. @see YGG-193 */
  const pingPublished = async (refs: Array<{ contentType: PublishableContentType, id: number }>) => {
    try {
      const byType = new Map<PublishableContentType, number[]>()
      for (const ref of refs) {
        const ids = byType.get(ref.contentType) ?? []
        ids.push(ref.id)
        byType.set(ref.contentType, ids)
      }
      const paths: string[] = []
      for (const [contentType, ids] of byType) {
        paths.push(...await publishing.resolvePublicPaths(contentType, ids))
      }
      await pingIndexNow(paths)
    }
    catch {
      // Discovery pings are opportunistic.
    }
  }

  return {
    publishDueScheduled: async () => {
      const result = await mapQueryErrors(() => publishing.publishDueScheduled())
      await pingPublished(result.publishedRefs)
      return result
    },
    publish: async (contentType: string, id: number, actor?: PublishActorContext) => {
      const result = await mapQueryErrors(async () =>
        publishing.publish(parsePublishableContentType(contentType), id, actor))
      await pingPublished([{ contentType: parsePublishableContentType(contentType), id }])
      return result
    },
    schedule: (contentType: string, id: number, scheduledAt: string) =>
      mapQueryErrors(async () => publishing.schedule(parsePublishableContentType(contentType), id, scheduledAt)),
    unpublish: (contentType: string, id: number) =>
      mapQueryErrors(async () => publishing.unpublish(parsePublishableContentType(contentType), id)),
  }
}

export function usePublishingService(event?: H3Event) {
  return createPublishingService(useDb(event))
}
