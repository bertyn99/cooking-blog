/**
 * Seed admin against the local libSQL database (no dev server required).
 *
 * For D1 / remote dev, prefer the Nitro task while the CMS dev server is running:
 *   pnpm task:seed:admin
 *   curl -X POST http://localhost:3001/_nitro/tasks/seed-admin \
 *     -H 'content-type: application/json' \
 *     -d '{"payload":{"email":"you@example.com","password":"your-password"}}'
 *
 * On deployed Workers (`cloudflare_module`), `/_nitro/tasks/*` is not available —
 * use POST /api/auth/seed-admin (bootstrap or ADMIN_SEED_SECRET).
 */
import { getLocalDb } from '../server/db/client'
import { seedAdmin } from '../server/db/seed/admin'
import { resolveSeedAdminInput, type SeedAdminPayload } from '../server/db/seed/defaults'

function readPayloadArg(): SeedAdminPayload {
  const arg = process.argv[2]?.trim()
  if (!arg) return {}
  return JSON.parse(arg) as SeedAdminPayload
}

async function main() {
  const db = getLocalDb()
  const result = await seedAdmin(db, resolveSeedAdminInput(readPayloadArg()))

  if (result.skipped) {
    console.log(`[seed:admin] skipped — ${result.reason}`)
    if (result.user) {
      console.log(`[seed:admin] existing admin: ${result.user.email} (id=${result.user.id})`)
    }
    return
  }

  if (!result.user) {
    throw new Error('Seed completed without returning a user')
  }

  console.log(`[seed:admin] created admin: ${result.user.email} (id=${result.user.id})`)
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`[seed:admin] failed — ${message}`)
  process.exitCode = 1
})
