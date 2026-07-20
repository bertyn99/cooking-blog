import { seedAdmin } from '../db/seed/admin'
import { resolveSeedAdminInput, seedAdminPayloadSchema } from '../db/seed/defaults'
import { useDb } from '../utils/db'

export default defineTask({
  meta: {
    name: 'seed-admin',
    description: 'Create the initial CMS admin user (idempotent)',
  },
  async run({ payload }) {
    const parsed = seedAdminPayloadSchema.safeParse(payload ?? {})
    if (!parsed.success) {
      throw new Error(`Invalid seed-admin payload: ${parsed.error.message}`)
    }

    const db = useDb()
    const result = await seedAdmin(db, resolveSeedAdminInput(parsed.data))

    return { result }
  },
})
