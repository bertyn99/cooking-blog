import type { H3Event } from 'h3'
import { createLogger } from 'evlog'
import { prefersD1Database, useDb } from '../utils/db'
import { ensureEditorDefaults, ensureHomePage } from '../services/ensure-home-page'

export default defineNitroPlugin((nitroApp) => {
  const log = createLogger({ plugin: 'ensure-defaults' })

  async function run(event?: H3Event) {
    try {
      const db = useDb(event)
      await ensureEditorDefaults(db)
      await ensureHomePage(db)
    }
    catch (error) {
      log.error(error instanceof Error ? error : String(error), {
        outcome: 'skipped',
      })
    }
    finally {
      log.emit()
    }
  }

  if (!prefersD1Database()) {
    void run()
    return
  }

  nitroApp.hooks.hookOnce('request', async (event) => {
    await run(event)
  })
})
