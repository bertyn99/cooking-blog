import type { H3Event } from 'h3'
import type { PublishActorContext } from '../db/queries/publishing'
import type { DbQueries } from '../db/queries'
import type { PublishableContentType } from '../utils/content-types'
import { isPublishableContentType } from '../utils/content-types'
import { fromQueryError } from '../utils/errors'
import { queryValidation } from '../db/query-errors'
import { useQueries } from '../utils/db'
import { pingIndexNow } from '../utils/indexnow'
import { createPinterestService } from './pinterest-service'

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

/** Publishing workflow — persistence via `useQueries` / `createDbQueries`. */
export function createPublishingService(queries: DbQueries, event?: H3Event) {
  const { publishing } = queries

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

  /**
   * Best-effort Pinterest enqueue — inserts `pending` pin rows (cover + body
   * images, spaced ≥72h). Never throws; the `pinterest-publish-due` task does
   * the actual pinning within the account cadence cap.
   */
  const enqueuePins = async (refs: Array<{ contentType: PublishableContentType, id: number }>) => {
    try {
      const pinterest = createPinterestService(queries, event)
      for (const ref of refs) {
        if (ref.contentType === 'articles' || ref.contentType === 'recipes') {
          await pinterest.enqueueForContent(ref.contentType, ref.id)
        }
      }
    }
    catch {
      // Pinterest enqueue is opportunistic.
    }
  }

  return {
    publishDueScheduled: async () => {
      const result = await mapQueryErrors(() => publishing.publishDueScheduled())
      await pingPublished(result.publishedRefs)
      await enqueuePins(result.publishedRefs)
      return result
    },
    publish: async (contentType: string, id: number, actor?: PublishActorContext) => {
      const result = await mapQueryErrors(async () =>
        publishing.publish(parsePublishableContentType(contentType), id, actor))
      await pingPublished([{ contentType: parsePublishableContentType(contentType), id }])
      await enqueuePins([{ contentType: parsePublishableContentType(contentType), id }])
      return result
    },
    schedule: (contentType: string, id: number, scheduledAt: string) =>
      mapQueryErrors(async () => publishing.schedule(parsePublishableContentType(contentType), id, scheduledAt)),
    unpublish: (contentType: string, id: number) =>
      mapQueryErrors(async () => publishing.unpublish(parsePublishableContentType(contentType), id)),
  }
}

export function usePublishingService(event?: H3Event) {
  return createPublishingService(useQueries(event), event)
}
