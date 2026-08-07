import { createLogger } from 'evlog'
import { isSqliteBusyError } from '../utils/sqlite-busy'
import { useContentGenerationService } from '../services/generation/service'

export default defineTask({
  meta: {
    name: 'generation-process',
    description: 'Advance queued AI generation runs (bounded poller scaffold)',
  },
  async run() {
    const log = createLogger({ task: 'generation-process' })
    try {
      const result = await useContentGenerationService().processDueRuns(5)
      log.set({ outcome: 'success', generation: result })
      return { result }
    } catch (error) {
      if (isSqliteBusyError(error)) {
        log.warn('Generation processing skipped because the database is busy.', {
          outcome: 'skipped',
          reason: 'sqlite_busy',
        })
        return { result: { claimed: 0, results: [] } }
      }
      log.error(error instanceof Error ? error : String(error), {
        outcome: 'failure',
      })
      throw error
    } finally {
      log.emit()
    }
  },
})
