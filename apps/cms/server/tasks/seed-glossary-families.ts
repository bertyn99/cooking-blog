import { createLogger } from 'evlog'
import { seedGlossaryFamilies } from '../db/seed/glossary-families'
import { useDb } from '../utils/db'
import { defineTask } from 'nitropack/runtime'

export default defineTask({
  meta: {
    name: 'seed-glossary-families',
    description: 'Link curated ingredient forms to family roots (parentId only, no cover copy)',
  },
  async run() {
    const log = createLogger({ task: 'seed-glossary-families' })
    try {
      const stats = await seedGlossaryFamilies(useDb())
      log.set({
        outcome: 'success',
        rootsCreated: stats.rootsCreated,
        formsLinked: stats.formsLinked,
        skipped: stats.skipped,
      })
      return { result: stats }
    }
    catch (error) {
      log.error(error instanceof Error ? error : String(error), {
        outcome: 'failure',
      })
      throw error
    }
    finally {
      log.emit()
    }
  },
})
