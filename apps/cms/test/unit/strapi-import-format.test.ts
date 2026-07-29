import { describe, expect, it } from 'vitest'
import { formatStepStatsMessage } from '../../shared/strapi-import'

describe('formatStepStatsMessage', () => {
  it('signals fully unchanged step', () => {
    expect(formatStepStatsMessage('category-articles', {
      created: 0,
      updated: 0,
      skipped: 6,
      errors: 0,
    })).toBe('category-articles — déjà synchronisé (6 entrée(s) inchangée(s))')
  })

  it('signals mixed changes', () => {
    expect(formatStepStatsMessage('articles', {
      created: 1,
      updated: 2,
      skipped: 40,
      errors: 0,
    })).toBe('articles — créés 1, mis à jour 2, inchangés 40')
  })
})
