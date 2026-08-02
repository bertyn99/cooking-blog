import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { createEvent } from 'h3'
import { canRunAdminSeed } from '../../server/utils/auth/seed-admin-access'

describe('canRunAdminSeed', () => {
  beforeEach(() => {
    vi.stubEnv('ADMIN_SEED_SECRET', 'test-secret')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('allows seed when bootstrap', () => {
    const event = createEvent({ path: '/api/auth/seed-admin' })
    expect(canRunAdminSeed(event, true)).toBe(true)
  })

  it('allows seed with matching x-admin-seed-secret when not bootstrap', () => {
    const event = createEvent({
      path: '/api/auth/seed-admin',
      headers: { 'x-admin-seed-secret': 'test-secret' },
    })
    expect(canRunAdminSeed(event, false)).toBe(true)
  })

  it('rejects seed without secret when not bootstrap', () => {
    const event = createEvent({ path: '/api/auth/seed-admin' })
    expect(canRunAdminSeed(event, false)).toBe(false)
  })

  it('rejects seed when ADMIN_SEED_SECRET is unset', () => {
    vi.stubEnv('ADMIN_SEED_SECRET', '')
    const event = createEvent({
      path: '/api/auth/seed-admin',
      headers: { 'x-admin-seed-secret': 'anything' },
    })
    expect(canRunAdminSeed(event, false)).toBe(false)
  })
})
