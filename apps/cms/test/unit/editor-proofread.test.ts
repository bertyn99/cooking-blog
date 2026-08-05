import { describe, expect, it } from 'vitest'
import { normalizeProofreadCorrections } from '../../server/services/ai/editor-proofread'

describe('normalizeProofreadCorrections', () => {
  it('keeps valid offsets', () => {
    const text = 'Le poulait est delicieux.'
    const result = normalizeProofreadCorrections(text, [{
      original: 'poulait',
      suggestion: 'poulet',
      message: 'Orthographe',
      start: 3,
      end: 10,
    }])
    expect(result).toHaveLength(1)
    expect(result[0]?.suggestion).toBe('poulet')
  })

  it('repairs bad offsets via closest indexOf match', () => {
    const text = 'Le poulait est delicieux.'
    const result = normalizeProofreadCorrections(text, [{
      original: 'delicieux',
      suggestion: 'délicieux',
      message: 'Accent',
      start: 0,
      end: 1,
    }])
    expect(result).toHaveLength(1)
    expect(result[0]?.start).toBe(text.indexOf('delicieux'))
  })

  it('picks the occurrence nearest model start when duplicated', () => {
    const text = 'foo bar foo baz'
    const result = normalizeProofreadCorrections(text, [{
      original: 'foo',
      suggestion: 'fou',
      message: 'Typo',
      start: 8,
      end: 11,
    }])
    expect(result).toHaveLength(1)
    expect(result[0]?.start).toBe(8)
  })

  it('drops no-ops and oversized spans', () => {
    const text = 'Une phrase correcte assez longue pour tester le filtre des spans trop larges.'
    const result = normalizeProofreadCorrections(text, [
      {
        original: 'Une',
        suggestion: 'Une',
        message: 'No-op',
        start: 0,
        end: 3,
      },
      {
        original: text,
        suggestion: 'Autre',
        message: 'Trop large',
        start: 0,
        end: text.length,
      },
    ])
    expect(result).toHaveLength(0)
  })
})
