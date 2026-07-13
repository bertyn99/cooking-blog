import { useDb } from '../utils/db'
import { createPublishingService } from '../services/publishing-service'

export default defineTask({
  meta: {
    name: 'publish-scheduled',
    description: 'Publish content whose scheduledAt has passed',
  },
  async run() {
    const db = useDb()
    const publishing = createPublishingService(db)
    const result = await publishing.publishDueScheduled()
    return { result }
  },
})
