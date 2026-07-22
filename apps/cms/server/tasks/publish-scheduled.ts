import { usePublishingService } from '../services/publishing-service'
import { isSqliteBusyError } from '../utils/sqlite-busy'

export default defineTask({
  meta: {
    name: 'publish-scheduled',
    description: 'Publish content whose scheduledAt has passed',
  },
  async run() {
    try {
      const result = await usePublishingService().publishDueScheduled()
      return { result }
    }
    catch (error) {
      if (isSqliteBusyError(error)) {
        console.warn('[publish-scheduled] skipped — database busy')
        return { result: { published: 0, skipped: true as const } }
      }
      throw error
    }
  },
})
