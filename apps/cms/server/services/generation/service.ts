import type { H3Event } from 'h3'
import { createContentGenerationQueries } from '../../db/queries/content-generation'
import type { AppDb } from '../../db/create-db'
import { useGenerationArtifactStore } from './artifact-storage'
import { useGenerationProgressStore } from './progress'

export function createContentGenerationService(db: AppDb, event?: H3Event) {
  const deps = {
    artifacts: useGenerationArtifactStore(event),
    progress: useGenerationProgressStore(event),
  }
  const queries = createContentGenerationQueries(db, deps)
  return {
    async processDueRuns(limit = 5) {
      const claimed = await queries.claimRunnableRuns(limit)
      const results = []
      for (const runId of claimed) {
        try {
          results.push(await queries.processRunOnce(runId))
        }
        catch (error) {
          results.push({ runId, error: String(error) })
        }
      }
      return { claimed: claimed.length, results }
    },
    getProgress(runId: string) {
      return deps.progress.get(runId)
    },
  }
}
