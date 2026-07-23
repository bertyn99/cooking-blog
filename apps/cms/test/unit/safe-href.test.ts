import { describe, expect, it } from 'vitest'
import { safeHrefSchema } from '../../server/utils/validations/safe-href'

describe('safeHrefSchema', () => {
  it('allows relative paths', () => {
    expect(safeHrefSchema.safeParse('/blog/foo').success).toBe(true)
  })

  it('rejects protocol-relative URLs', () => {
    expect(safeHrefSchema.safeParse('//evil.example').success).toBe(false)
  })

  it('rejects javascript URLs', () => {
    expect(safeHrefSchema.safeParse('javascript:alert(1)').success).toBe(false)
  })
})
