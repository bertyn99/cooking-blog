/**
 * POST /api/auth/login
 *
 * Authenticates a user with email + password and returns a JWT plus the
 * sanitized user object. Implements IP-based rate limiting via NuxtHub KV:
 * after 5 failed attempts within 15 minutes, the IP is blocked.
 *
 * Body: { email: string, password: string }
 * Response: { token: string, user: SafeUser }
 */
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { db, schema } from 'hub:db'
import { kv } from 'hub:kv'
import type { H3Event } from 'h3'
import {
  sanitizeUser,
  signJwt,
  verifyPassword
} from '../../utils/auth'
import { createRateLimiter } from '../../utils/rate-limit'
import type { RateLimiter } from '../../utils/rate-limit'
import { createApiError } from '../../utils/errors'

/** Singleton rate-limiter bound to the production KV store. */
const limiter: RateLimiter = createRateLimiter(kv, {
  prefix: 'login:fail',
  maxFailures: 5,
  windowSeconds: 15 * 60 // 15 minutes
})

const loginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(1).max(512)
})

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

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = loginSchema.safeParse(body)
  if (!parsed.success) {
    throw createApiError('VALIDATION_ERROR', 'Invalid login payload', parsed.error.flatten())
  }
  const { email, password } = parsed.data

  const ip = getClientIp(event)

  // Pre-check: if IP is already over the limit, refuse without touching the
  // database to prevent password-guessing attacks.
  const status = await limiter.check(ip)
  if (status.blocked) {
    throw createApiError(
      'FORBIDDEN',
      'Too many failed login attempts. Try again later.',
      { retryAfterSeconds: 15 * 60 }
    )
  }

  // Look up the user by email.
  const rows = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, email.toLowerCase()))
    .limit(1)

  const user = rows[0]

  // Always run the password-verification cost — even when the user doesn't
  // exist — to blunt user-enumeration timing attacks. We verify against a
  // fixed dummy hash and discard the result.
  const DUMMY_HASH
    = 'pbkdf2:100000:sha256:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA='
  let passwordOk = false
  if (user) {
    passwordOk = await verifyPassword(password, user.passwordHash)
  } else {
    await verifyPassword(password, DUMMY_HASH)
    passwordOk = false
  }

  if (!user || !passwordOk) {
    await limiter.increment(ip)
    throw createApiError('UNAUTHORIZED', 'Invalid email or password')
  }

  // Success — reset the counter and issue JWT.
  await limiter.reset(ip)

  const token = await signJwt({
    sub: user.id,
    email: user.email,
    role: user.role
  })

  return {
    token,
    user: sanitizeUser(user)
  }
})
