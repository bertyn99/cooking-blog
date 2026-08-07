import type { H3Event } from 'h3'
import { imageDeliveryCacheTags } from '../../shared/image-delivery-policy'
import { runInBackground } from './background-task'

export interface WorkersCachePurge {
  purge(options: { tags?: string[]; prefixes?: string[] }): Promise<unknown>
}

function getWorkersCache(event: H3Event): WorkersCachePurge | undefined {
  const ctx = (
    event.context.cloudflare as
      | {
          context?: { cache?: WorkersCachePurge }
        }
      | undefined
  )?.context
  const cache = ctx?.cache
  if (cache && typeof cache.purge === 'function') {
    return cache
  }
  return undefined
}

export function imageDeliveryCacheTagList(assetPath: string): string[] {
  return imageDeliveryCacheTags(assetPath).split(',')
}

/**
 * Purge Workers Cache entries for a deleted or replaced blob (Alchemy `cache` prop).
 * No-op in local dev when `ctx.cache` is unavailable.
 */
export async function purgeImageDeliveryCache(event: H3Event, assetPath: string) {
  const cache = getWorkersCache(event)
  if (!cache) {
    return
  }
  const tags = imageDeliveryCacheTagList(assetPath)
  await runInBackground(
    event,
    async () => {
      await cache.purge({ tags })
    },
    { task: 'purge-image-delivery-cache', assetPath, tags }
  )
}

/** Purge all image variants (e.g. maintenance wipe). */
export async function purgeAllMediaImageCache(event: H3Event) {
  const cache = getWorkersCache(event)
  if (!cache) {
    return
  }
  await runInBackground(
    event,
    async () => {
      await cache.purge({ tags: ['media'] })
    },
    { task: 'purge-all-media-image-cache' }
  )
}
