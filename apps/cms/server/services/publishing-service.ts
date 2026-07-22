import type { H3Event } from 'h3'
import { createPublishingQueries } from '../db/queries/publishing'
import type { AppDb } from '../db/create-db'
import type { PublishableContentType } from '../utils/content-types'
import { isPublishableContentType } from '../utils/content-types'
import { fromQueryError } from '../utils/errors'
import { queryValidation } from '../db/query-errors'
import { useDb } from '../utils/db'

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
  return {
    publishDueScheduled: () => publishing.publishDueScheduled(),
    publish: (contentType: string, id: number) =>
      mapQueryErrors(async () => publishing.publish(parsePublishableContentType(contentType), id)),
    schedule: (contentType: string, id: number, scheduledAt: string) =>
      mapQueryErrors(async () => publishing.schedule(parsePublishableContentType(contentType), id, scheduledAt)),
    unpublish: (contentType: string, id: number) =>
      mapQueryErrors(async () => publishing.unpublish(parsePublishableContentType(contentType), id)),
  }
}

export function usePublishingService(event?: H3Event) {
  return createPublishingService(useDb(event))
}
