import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { createEvent } from 'h3'
import {
  canSeedAdminWithoutSecret,
  hasValidAdminSeedSecret,
} from '../../server/utils/auth/seed-admin-access'

describe('seed-admin access', () => {
  beforeEach(() => {
    vi.stubEnv('ADMIN_SEED_SECRET', 'test-secret')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('allows without secret when users table is empty', () => {
    expect(canSeedAdminWithoutSecret(true, true)).toBe(true)
    expect(canSeedAdminWithoutSecret(true, false)).toBe(true)
  })

  it('allows without secret when users exist but no admin', () => {
    expect(canSeedAdminWithoutSecret(false, true)).toBe(true)
  })

  it('requires secret when an admin already exists', () => {
    expect(canSeedAdminWithoutSecret(false, false)).toBe(false)
  })

  it('validates x-admin-seed-secret', () => {
    const event = createEvent({
      path: '/api/auth/seed-admin',
      headers: { 'x-admin-seed-secret': 'test-secret' },
    })
    expect(hasValidAdminSeedSecret(event)).toBe(true)
  })

  it('rejects seed secret when env unset', () => {
    vi.stubEnv('ADMIN_SEED_SECRET', '')
    const event = createEvent({
      path: '/api/auth/seed-admin',
      headers: { 'x-admin-seed-secret': 'anything' },
    })
    expect(hasValidAdminSeedSecret(event)).toBe(false)
  })
})
