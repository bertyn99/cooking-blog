import { describe, expect, it } from 'vitest'
import { getErrorCode } from '../../shared/error-code'

describe('getErrorCode', () => {
  it('reads a Nuxt diagnostic code from an error instance', () => {
    const error = Object.assign(new Error('Missing Nuxt context'), {
      code: 'NUXT_E1001',
    })

    expect(getErrorCode(error)).toBe('NUXT_E1001')
  })

  it('reads a serialized Nuxt diagnostic code from the error name', () => {
    expect(
      getErrorCode({
        name: 'NUXT_E1001',
        message: 'Missing Nuxt context',
      })
    ).toBe('NUXT_E1001')
  })

  it('reads application codes from an API error envelope', () => {
    expect(
      getErrorCode({
        data: {
          error: {
            code: 'INTERNAL_ERROR',
          },
        },
      })
    ).toBe('INTERNAL_ERROR')
  })

  it('prefers the application code over a transport error code', () => {
    expect(
      getErrorCode({
        code: 'ERR_BAD_REQUEST',
        data: {
          error: {
            code: 'FORBIDDEN',
          },
        },
      })
    ).toBe('FORBIDDEN')
  })

  it('ignores a generic Error name when no code is available', () => {
    expect(getErrorCode(new Error('Unknown failure'))).toBeUndefined()
  })
})
