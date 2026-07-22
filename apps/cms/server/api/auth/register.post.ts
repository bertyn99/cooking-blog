import { registerSchema } from '../../../shared/validators/auth'
import { toSessionUser } from '../../utils/auth/user'
import { canManageUsers } from '../../../shared/abilities'
import { createApiError } from '../../utils/errors'
import { useQueries } from '../../utils/db'
import { isBootstrapMode } from '../../utils/auth/bootstrap'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = registerSchema.safeParse(body)
  if (!parsed.success) {
    throw createApiError(
      'VALIDATION_ERROR',
      'Invalid registration payload',
      parsed.error.flatten(),
    )
  }
  const { email, username, password, role } = parsed.data
  const { users } = useQueries(event)

  const bootstrap = await isBootstrapMode(event)

  if (!bootstrap) {
    await requireUserSession(event)
    await authorize(event, canManageUsers)
  }

  if (await users.emailExists(email)) {
    throw createApiError('VALIDATION_ERROR', 'Email is already registered')
  }

  const resolvedRole: 'admin' | 'editor' = bootstrap ? 'admin' : (role ?? 'editor')

  const passwordHash = await hashPassword(password)

  const newUser = await users.insert({
    email,
    username: username ?? null,
    passwordHash,
    role: resolvedRole,
  })

  if (!newUser) {
    throw createApiError('INTERNAL_ERROR', 'Failed to create user')
  }

  const safeUser = toSessionUser(newUser)

  if (bootstrap) {
    await setUserSession(event, {
      user: safeUser,
      loggedInAt: Date.now(),
    })
  }

  return {
    user: safeUser,
    bootstrap,
  }
})
