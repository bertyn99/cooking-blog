import { useLogger } from 'evlog'
import { loginSchema } from '../../../shared/validators/auth'
import { toSessionUser } from '../../utils/auth/user'
import { getClientIp } from '../../utils/client-ip'
import { createRateLimiter } from '../../utils/rate-limit'
import { createApiError } from '../../utils/errors'
import { useKvStore } from '../../utils/kv'
import { useQueries } from '../../utils/db'
import type { H3Event } from 'h3'

const LOGIN_LIMIT = {
  prefix: 'login:fail',
  maxFailures: 5,
  windowSeconds: 15 * 60,
} as const

const DUMMY_HASH =
  'pbkdf2:100000:sha256:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA='

function getLoginLimiter(event: H3Event) {
  return createRateLimiter(useKvStore(event), LOGIN_LIMIT)
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = loginSchema.safeParse(body)
  if (!parsed.success) {
    throw createApiError('VALIDATION_ERROR', 'Invalid login payload', parsed.error.flatten())
  }
  const { email, password } = parsed.data

  const ip = getClientIp(event)
  const { users } = useQueries(event)
  const limiter = getLoginLimiter(event)

  const status = await limiter.check(ip)
  if (status.blocked) {
    throw createApiError('FORBIDDEN', 'Too many failed login attempts. Try again later.', {
      retryAfterSeconds: 15 * 60,
    })
  }

  const user = await users.findByEmail(email)

  let passwordOk = false
  if (user) {
    passwordOk = await verifyPassword(user.passwordHash, password)
  } else {
    await verifyPassword(DUMMY_HASH, password)
  }

  if (!user || !passwordOk) {
    await limiter.increment(ip)
    throw createApiError('UNAUTHORIZED', 'Invalid email or password')
  }

  if (!user.isActive) {
    throw createApiError('FORBIDDEN', 'Ce compte a été désactivé.', undefined, {
      fix: 'Contactez un administrateur.',
    })
  }

  await limiter.reset(ip)

  const log = useLogger(event as Parameters<typeof useLogger>[0])
  log.set({ auth: { action: 'login', userId: user.id, role: user.role } })

  const safeUser = toSessionUser(user)
  await setUserSession(event, {
    user: safeUser,
    loggedInAt: Date.now(),
  })

  return { user: safeUser }
})
