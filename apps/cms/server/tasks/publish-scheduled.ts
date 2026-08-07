import { createLogger } from 'evlog'
import { usePublishingService } from '../services/publishing-service'
import { isSqliteBusyError } from '../utils/sqlite-busy'

export default defineTask({
  meta: {
    name: 'publish-scheduled',
    description: 'Publish content whose scheduledAt has passed',
  },
  async run() {
    const log = createLogger({ task: 'publish-scheduled' })
    try {
      const result = await usePublishingService().publishDueScheduled()
      log.set({ outcome: 'success', publishing: result })
      return { result }
    } catch (error) {
      if (isSqliteBusyError(error)) {
        log.warn('Scheduled publishing skipped because the database is busy.', {
          outcome: 'skipped',
          reason: 'sqlite_busy',
        })
        return { result: { published: 0, skipped: 0 } }
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
