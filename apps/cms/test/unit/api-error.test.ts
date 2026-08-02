import { describe, expect, it } from 'vitest'
import { getApiErrorMessage } from '../../shared/api-error'

describe('getApiErrorMessage', () => {
  it('reads evlog nitro envelope with boolean error flag', () => {
    const message = getApiErrorMessage({
      data: {
        error: true,
        message: 'Invalid email or password',
        data: {
          code: 'UNAUTHORIZED',
          why: 'Invalid email or password',
          fix: 'Reconnectez-vous.',
        },
      },
      statusMessage: 'Invalid email or password',
    })
    expect(message).toBe('Invalid email or password')
  })

  it('reads structured createApiError body', () => {
    const message = getApiErrorMessage({
      data: {
        error: {
          code: 'FORBIDDEN',
          message: 'Ce compte a été désactivé.',
        },
      },
    })
    expect(message).toBe('Ce compte a été désactivé.')
  })
})
