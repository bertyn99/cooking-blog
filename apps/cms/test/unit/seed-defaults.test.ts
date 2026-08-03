import { describe, expect, it } from 'vitest'
import {
  DEFAULT_ADMIN_EMAIL,
  DEFAULT_ADMIN_PASSWORD,
  resolveSeedAdminInput,
} from '../../server/db/seed/defaults'

describe('resolveSeedAdminInput', () => {
  it('uses built-in defaults when payload and env are empty', () => {
    const input = resolveSeedAdminInput({})

    expect(input.email).toBe(DEFAULT_ADMIN_EMAIL)
    expect(input.password).toBe(DEFAULT_ADMIN_PASSWORD)
    expect(input.skipIfAdminExists).toBe(true)
  })

  it('prefers payload values over defaults', () => {
    const input = resolveSeedAdminInput({
      email: 'Chef@Example.com',
      password: 'custompass1',
      username: 'chef',
      force: true,
    })

    expect(input).toEqual({
      email: 'chef@example.com',
      password: 'custompass1',
      username: 'chef',
      skipIfAdminExists: false,
      resetPassword: false,
    })
  })
})
