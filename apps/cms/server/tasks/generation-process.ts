import { isSqliteBusyError } from '../utils/sqlite-busy'
import { useContentGenerationService } from '../services/generation/service'

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
