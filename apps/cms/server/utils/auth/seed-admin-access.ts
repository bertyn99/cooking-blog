import type { H3Event } from 'h3'

function readHeader(event: H3Event, name: string): string | undefined {
  const value = event.node?.req?.headers?.[name.toLowerCase()]
  if (Array.isArray(value)) {
    return value[0]
  }
  return typeof value === 'string' ? value : undefined
}

function readSeedSecretFromRequest(event: H3Event): string | undefined {
  const headerSecret = readHeader(event, 'x-admin-seed-secret')
  if (headerSecret) {
    return headerSecret
  }

  const authorization = readHeader(event, 'authorization')
  if (authorization?.startsWith('Bearer ')) {
    return authorization.slice('Bearer '.length).trim()
  }

  return undefined
}

export function hasValidAdminSeedSecret(event: H3Event): boolean {
  const configured = process.env.ADMIN_SEED_SECRET?.trim()
  if (!configured) {
    return false
  }

  const provided = readSeedSecretFromRequest(event)
  return provided === configured
}

/** No secret required: empty `users` table or no `admin` role yet. */
export function canSeedAdminWithoutSecret(emptyUsers: boolean, lacksAdmin: boolean): boolean {
  return emptyUsers || lacksAdmin
}
