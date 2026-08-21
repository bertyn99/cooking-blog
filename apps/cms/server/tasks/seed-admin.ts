import { createLogger } from 'evlog'
import { seedAdmin } from '../db/seed/admin'
import { seedAgentUser } from '../db/seed/agent'
import { resolveSeedAdminInput, seedAdminPayloadSchema } from '../db/seed/defaults'
import { useDb } from '../utils/db'

export default defineTask({
  meta: {
    name: 'seed-admin',
    description: 'Create the initial CMS admin user (idempotent)',
  },
  async run({ payload }) {
    const log = createLogger({ task: 'seed-admin' })
    try {
      const parsed = seedAdminPayloadSchema.safeParse(payload ?? {})
      if (!parsed.success) {
        throw new Error(`Invalid seed-admin payload: ${parsed.error.message}`)
      }

      const db = useDb()
      const result = await seedAdmin(db, resolveSeedAdminInput(parsed.data))
      const agent = await seedAgentUser(db)

      log.set({
        outcome: result.skipped ? 'skipped' : 'success',
        admin: {
          userId: result.user?.id,
          skipped: result.skipped,
        },
        agent: {
          userId: agent.user.id,
          created: agent.created,
        },
      })
      return { result, agent }
    } catch (error) {
      log.error(error instanceof Error ? error : String(error), {
        outcome: 'failure',
      })
      throw error
    } finally {
      log.emit()
    }
  },
})
