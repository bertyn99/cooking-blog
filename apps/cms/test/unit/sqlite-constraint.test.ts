import { describe, expect, it } from 'vitest'
import {
  isPageHomeUniqueConstraint,
  isPageSlugUniqueConstraint,
  isSqliteUniqueConstraint,
} from '../../server/utils/sqlite-constraint'

describe('sqlite-constraint', () => {
  it('detects unique failures', () => {
    expect(isSqliteUniqueConstraint(new Error('UNIQUE constraint failed: pages.slug, pages.locale'))).toBe(true)
    expect(isSqliteUniqueConstraint(new Error('boom'))).toBe(false)
  })

  it('distinguishes home unique from slug unique', () => {
    expect(isPageHomeUniqueConstraint(new Error('UNIQUE constraint failed: pages_is_home_locale_active_idx'))).toBe(true)
    expect(isPageHomeUniqueConstraint(new Error('UNIQUE constraint failed: pages.locale'))).toBe(true)
    expect(isPageSlugUniqueConstraint(new Error('UNIQUE constraint failed: pages.slug, pages.locale'))).toBe(true)
    expect(isPageHomeUniqueConstraint(new Error('UNIQUE constraint failed: pages.slug, pages.locale'))).toBe(false)
    expect(isPageSlugUniqueConstraint(new Error('UNIQUE constraint failed: pages.locale'))).toBe(false)
  })
})
