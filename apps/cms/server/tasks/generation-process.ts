import { useDb } from '../utils/db'
import { isSqliteBusyError } from '../utils/sqlite-busy'
import { createContentGenerationQueries } from '../db/queries/content-generation'

export function createContentGenerationService(db: ReturnType<typeof useDb>) {
  const queries = createContentGenerationQueries(db)
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
  }
}

export function useContentGenerationService(event?: Parameters<typeof useDb>[0]) {
  return createContentGenerationService(useDb(event))
}

export default defineTask({
  meta: {
    name: 'generation-process',
    description: 'Advance queued AI generation runs (bounded poller scaffold)',
  },
  async run() {
    try {
      const result = await useContentGenerationService().processDueRuns(5)
      return { result }
    }
    catch (error) {
      if (isSqliteBusyError(error)) {
        console.warn('[generation-process] skipped — database busy')
        return { result: { claimed: 0, skipped: true as const } }
      }
      throw error
    }
  },
})
