import { isBootstrapMode, lacksAdminUser } from '../../utils/auth/bootstrap'
import {
  canSeedAdminWithoutSecret,
  hasValidAdminSeedSecret,
} from '../../utils/auth/seed-admin-access'
import { createApiError } from '../../utils/errors'

/**
 * Public setup hints for production (no secrets, no user emails).
 * Use before calling register / seed-admin to see which path applies.
 */
export default defineEventHandler(async (event) => {
  const emptyUsers = await isBootstrapMode(event)
  const lacksAdmin = await lacksAdminUser(event)

  return {
    emptyUsers,
    hasAdmin: !lacksAdmin,
    canRegisterWithoutAuth: emptyUsers,
    canSeedWithoutSecret: canSeedAdminWithoutSecret(emptyUsers, lacksAdmin),
    requiresSeedSecret: !canSeedAdminWithoutSecret(emptyUsers, lacksAdmin),
    seedSecretConfigured: Boolean(process.env.ADMIN_SEED_SECRET?.trim()),
    nitroTaskHttp: import.meta.dev,
    hint: emptyUsers
      ? 'POST /api/auth/register or POST /api/auth/seed-admin (no secret).'
      : lacksAdmin
        ? 'POST /api/auth/seed-admin without secret (no admin role in D1 yet).'
        : 'An admin exists: log in, or POST /api/auth/seed-admin with ADMIN_SEED_SECRET and resetPassword:true to change password.',
  }
})
