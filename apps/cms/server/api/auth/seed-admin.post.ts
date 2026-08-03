import { seedAdmin } from '../../db/seed/admin'
import { resolveSeedAdminInput, seedAdminPayloadSchema } from '../../db/seed/defaults'
import { isBootstrapMode, lacksAdminUser } from '../../utils/auth/bootstrap'
import {
  canSeedAdminWithoutSecret,
  hasValidAdminSeedSecret,
} from '../../utils/auth/seed-admin-access'
import { createApiError } from '../../utils/errors'
import { useDb } from '../../utils/db'

/**
 * Create the initial CMS admin on production (D1).
 *
 * `/_nitro/tasks/seed-admin` is only exposed by the Nitro **dev server** — on
 * Cloudflare Workers use this route instead. See GET /api/auth/setup-status.
 *
 * Without secret: empty `users` table OR no `role=admin` row yet.
 * With `ADMIN_SEED_SECRET`: additional admins (`force`) or password reset (`resetPassword`).
 */
export default defineEventHandler(async (event) => {
  const emptyUsers = await isBootstrapMode(event)
  const lacksAdmin = await lacksAdminUser(event)
  const secretOk = hasValidAdminSeedSecret(event)
  const withoutSecret = canSeedAdminWithoutSecret(emptyUsers, lacksAdmin)

  if (!withoutSecret && !secretOk) {
    throw createApiError(
      'FORBIDDEN',
      'Admin seed is not allowed',
      {
        emptyUsers,
        hasAdmin: !lacksAdmin,
      },
      {
        why: 'D1 already has an admin user and ADMIN_SEED_SECRET was not provided or did not match.',
        fix: 'Try logging in (default deploy seed may use changeme123). Or set ADMIN_SEED_SECRET on the worker and send x-admin-seed-secret with resetPassword:true to set a new password.',
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

  if (parsed.data.resetPassword && !secretOk) {
    throw createApiError(
      'FORBIDDEN',
      'Admin password reset requires ADMIN_SEED_SECRET',
      undefined,
      {
        fix: 'Set ADMIN_SEED_SECRET on the CMS worker and send it as x-admin-seed-secret or Authorization: Bearer.',
      },
    )
  }

  const db = useDb(event)
  const result = await seedAdmin(db, resolveSeedAdminInput(parsed.data))

  if ((emptyUsers || lacksAdmin) && (result.created || result.passwordUpdated) && result.user) {
    await setUserSession(event, {
      user: result.user,
      loggedInAt: Date.now(),
    })
  }

  return {
    emptyUsers,
    hasAdmin: !lacksAdmin,
    ...result,
  }
})
