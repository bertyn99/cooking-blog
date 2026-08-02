import { getHeader } from 'h3'
import type { H3Event } from 'h3'

function readSeedSecretFromRequest(event: H3Event): string | undefined {
  const headerSecret = getHeader(event, 'x-admin-seed-secret')
  if (headerSecret) {
    return headerSecret
  }

  const authorization = getHeader(event, 'authorization')
  if (authorization?.startsWith('Bearer ')) {
    return authorization.slice('Bearer '.length).trim()
  }

  return undefined
}

/**
 * Production seed: allowed when no users exist (bootstrap), or when
 * `ADMIN_SEED_SECRET` matches `x-admin-seed-secret` / `Authorization: Bearer`.
 */
export function canRunAdminSeed(event: H3Event, bootstrap: boolean): boolean {
  if (bootstrap) {
    return true
  }

  const configured = process.env.ADMIN_SEED_SECRET?.trim()
  if (!configured) {
    return false
  }

  const provided = readSeedSecretFromRequest(event)
  return provided === configured
}
