import { createLogger } from 'evlog'
import { defineTask } from 'nitropack/runtime'
import { usePinterestService } from '../services/pinterest-service'

export default defineTask({
  meta: {
    name: 'pinterest-publish-due',
    description: 'Create due Pinterest pins (fresh pins, 72h same-URL spacing, daily cap)',
  },
  async run() {
    const log = createLogger({ task: 'pinterest-publish-due' })
    try {
      const result = await usePinterestService().processDue()
      log.set({ outcome: 'success', ...result })
      return { result }
    }
    catch (error) {
      log.error(error instanceof Error ? error : String(error), { outcome: 'failure' })
      throw error
    }
    finally {
      log.emit()
    }
  },
})
