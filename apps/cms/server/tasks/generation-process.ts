import { useDb } from '../utils/db'
import { isSqliteBusyError } from '../utils/sqlite-busy'
import { createContentGenerationService } from '../services/generation/service'
import type { H3Event } from 'h3'

export function useContentGenerationService(event?: H3Event) {
  return createContentGenerationService(useDb(event), event)
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
