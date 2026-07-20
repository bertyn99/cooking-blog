/**
 * POST /api/auth/login
 *
 * IP-based rate limiting via Cloudflare KV (Cache binding).
 * Falls back to in-memory store in local dev without bindings.
 */
import { eq } from 'drizzle-orm'
import { schema } from '../../db/create-db'
import type { H3Event } from 'h3'
import { loginSchema } from '../../../shared/validators/auth'
import { toSessionUser } from '../../utils/auth/user'
import { createRateLimiter } from '../../utils/rate-limit'
import { createApiError } from '../../utils/errors'
import { useDb } from '../../utils/db'
import { useKvStore } from '../../utils/kv'

const LOGIN_LIMIT = {
  prefix: 'login:fail',
  maxFailures: 5,
  windowSeconds: 15 * 60,
} as const

function getLoginLimiter(event: H3Event) {
  return createRateLimiter(useKvStore(event), LOGIN_LIMIT)
}

/**
 * Returns the client IP for rate-limit keying. Falls back to 'unknown'
 * if no IP can be determined (e.g., local dev without proxy headers).
 */
function getClientIp(event: H3Event): string {
  const headers = getRequestHeaders(event)
  const forwarded = headers['x-forwarded-for']
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0]!.trim()
  }
  const nodeReq = (event as unknown as { node?: { req?: { remoteAddress?: string } } }).node
  if (nodeReq?.req?.remoteAddress) return nodeReq.req.remoteAddress
  return 'unknown'
}

// Fixed dummy hash used to keep password-verification cost constant when
// the email is unknown — blunts user-enumeration timing attacks.
const DUMMY_HASH
  = 'pbkdf2:100000:sha256:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA='

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = loginSchema.safeParse(body)
  if (!parsed.success) {
    throw createApiError('VALIDATION_ERROR', 'Invalid login payload', parsed.error.flatten())
  }
  const { email, password } = parsed.data

  const ip = getClientIp(event)
  const db = useDb(event)
  const limiter = getLoginLimiter(event)

  // Pre-check: if IP is already over the limit, refuse without touching the
  // database to prevent password-guessing attacks.
  const status = await limiter.check(ip)
  if (status.blocked) {
    throw createApiError(
      'FORBIDDEN',
      'Too many failed login attempts. Try again later.',
      { retryAfterSeconds: 15 * 60 },
    )
  }

  const rows = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, email.toLowerCase()))
    .limit(1)

  const user = rows[0]

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

  // Success — reset the counter and create a sealed session cookie.
  await limiter.reset(ip)

  const safeUser = toSessionUser(user)
  await setUserSession(event, {
    user: safeUser,
    loggedInAt: Date.now(),
  })

  return { user: safeUser }
})
