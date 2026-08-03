import { describe, expect, it } from 'vitest'
import { MAINTENANCE_PURGE_TARGETS } from '../../shared/maintenance'

describe('MAINTENANCE_PURGE_TARGETS', () => {
  it('includes legacy-strapi-map before media', () => {
    const mediaIdx = MAINTENANCE_PURGE_TARGETS.indexOf('media')
    const legacyIdx = MAINTENANCE_PURGE_TARGETS.indexOf('legacy-strapi-map')
    expect(legacyIdx).toBeGreaterThan(-1)
    expect(legacyIdx).toBeLessThan(mediaIdx)
  })
})
