import type { H3Event } from 'nitro/h3'
import type { GenerationStepKey } from '../../db/queries/content-generation'
import { useKvStore, type KvStore } from '../../utils/kv'

export interface GenerationProgress {
  runId: string
  stepKey: GenerationStepKey | 'queued' | 'awaiting_review' | 'failed'
  status: 'pending' | 'running' | 'succeeded' | 'failed'
  updatedAt: string
  message?: string
}

const TTL_SECONDS = 60 * 60 * 24 * 14

function progressKey(runId: string) {
  return `generation:progress:${runId}`
}

export interface GenerationProgressStore {
  set(progress: GenerationProgress): Promise<void>
  get(runId: string): Promise<GenerationProgress | null>
}

export function createGenerationProgressStore(kv: KvStore): GenerationProgressStore {
  return {
    async set(progress) {
      await kv.set(progressKey(progress.runId), progress, { ttl: TTL_SECONDS })
    },
    async get(runId) {
      return kv.get<GenerationProgress>(progressKey(runId))
    },
  }
}

export function useGenerationProgressStore(event?: H3Event): GenerationProgressStore {
  return createGenerationProgressStore(useKvStore(event))
}
