import { seedAdmin } from '../../db/seed/admin'
import { resolveSeedAdminInput, seedAdminPayloadSchema } from '../../db/seed/defaults'
import { isBootstrapMode } from '../../utils/auth/bootstrap'
import { canRunAdminSeed } from '../../utils/auth/seed-admin-access'
import { createApiError } from '../../utils/errors'
import { useDb } from '../../utils/db'

/**
 * Create the initial CMS admin on production (D1).
 *
 * `/_nitro/tasks/seed-admin` is only exposed by the Nitro **dev server** — on
 * Cloudflare Workers use this route instead.
 *
 * - Bootstrap (empty `users` table): no secret required.
 * - Otherwise: set `ADMIN_SEED_SECRET` on the worker and send
 *   `x-admin-seed-secret` or `Authorization: Bearer <secret>`.
 */
export default defineEventHandler(async (event) => {
  const bootstrap = await isBootstrapMode(event)

  if (!canRunAdminSeed(event, bootstrap)) {
    throw createApiError(
      'FORBIDDEN',
      'Admin seed is not allowed',
      undefined,
      {
        why: bootstrap
          ? 'Seed authorization failed unexpectedly.'
          : 'No users bootstrap and missing or invalid ADMIN_SEED_SECRET.',
        fix: bootstrap
          ? undefined
          : 'Use POST /api/auth/register when the users table is empty, or set ADMIN_SEED_SECRET and retry with x-admin-seed-secret.',
      },
    )
  }

  const body = await readBody(event)
  const parsed = seedAdminPayloadSchema.safeParse(body ?? {})
  if (!parsed.success) {
    throw createApiError(
      'VALIDATION_ERROR',
      'Invalid seed-admin payload',
      parsed.error.flatten(),
    )
  }

  const db = useDb(event)
  const result = await seedAdmin(db, resolveSeedAdminInput(parsed.data))

  if (bootstrap && result.created && result.user) {
    await setUserSession(event, {
      user: result.user,
      loggedInAt: Date.now(),
    })
  }

  return {
    bootstrap,
    ...result,
  }
})
