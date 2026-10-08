import { describe, expect, it } from 'vitest'
import { normalizeVerdicts, verdictFromAnswers } from '../../server/services/stock/rerank'
import type { StockSearchItem } from '../../server/services/stock/pexels'

function item(id: string, alt: string, width = 1600, height = 1067): StockSearchItem {
  return {
    id,
    provider: 'pexels',
    width,
    height,
    alt,
    photographer: 'X',
    photographerUrl: 'https://pexels.test/x',
    pageUrl: 'https://pexels.test/p/1',
    previewUrl: 'https://pexels.test/p/1/small',
    src: {} as StockSearchItem['src'],
  }
}

const items = [
  item('a', 'Bruschetta au basilic sur planche'),
  item('b', 'Femme tenant une carte de visite'),
  item('c', 'Tomates cerises'),
]

describe('normalizeVerdicts', () => {
  it('clamps scores, drops unknown ids and dedupes', () => {
    const ranking = normalizeVerdicts(items, [
      { id: 'a', score: 42, keep: true, reason: 'Sujet exact' },
      { id: 'zzz', score: 9, keep: true, reason: 'inconnu' },
      { id: 'a', score: 5, keep: true, reason: 'doublon' },
      { id: 'c', score: -3, keep: false, reason: 'Ingrédient brut' },
    ])
    expect(ranking.map(r => r.id)).toEqual(['a', 'c', 'b'])
    expect(ranking[0].score).toBe(10)
    expect(ranking[1].score).toBe(-1)
    expect(ranking[1].keep).toBe(false)
    expect(ranking[2].score).toBe(-1)
  })

  it('keeps every candidate when the model returns nothing', () => {
    const ranking = normalizeVerdicts(items, [])
    expect(ranking).toHaveLength(3)
    expect(ranking.every(r => r.keep)).toBe(true)
    expect(ranking.every(r => r.score === -1)).toBe(true)
    expect(ranking.every(r => r.reason === 'Évaluation indisponible.')).toBe(true)
  })
})

describe('verdictFromAnswers', () => {
  const bruschetta = item('x', 'Bruschetta', 1600, 1067)

  it('keeps a confident subject match with a high score', () => {
    const v = verdictFromAnswers(bruschetta, {
      subject: { probability: 0.95 },
      single: { probability: 0.9 },
      clean: { probability: 0.92 },
      appetizing: { probability: 0.85 },
    })
    expect(v.keep).toBe(true)
    expect(v.score).toBeGreaterThan(8)
    expect(v.reason).toContain('Sujet confirmé')
  })

  it('rejects when the subject does not match, citing the deciding criterion', () => {
    const v = verdictFromAnswers(bruschetta, {
      subject: { probability: 0.2 },
      single: { probability: 0.9 },
      clean: { probability: 0.9 },
      appetizing: { probability: 0.9 },
    })
    expect(v.keep).toBe(false)
    expect(v.reason).toContain('Sujet hors cible')
  })

  it('rejects overlays and cites cleanliness', () => {
    const v = verdictFromAnswers(bruschetta, {
      subject: { probability: 0.9 },
      single: { probability: 0.9 },
      clean: { probability: 0.3 },
      appetizing: { probability: 0.9 },
    })
    expect(v.keep).toBe(false)
    expect(v.reason).toContain('Surcouche')
  })

  it('treats missing answers as uncertain, not as failures', () => {
    const v = verdictFromAnswers(bruschetta, {})
    expect(v.keep).toBe(true)
    expect(v.score).toBeGreaterThan(0)
  })

  it('penalises portrait geometry', () => {
    const portrait = verdictFromAnswers(item('p', 'Bruschetta', 800, 1200), {
      subject: { probability: 0.95 },
      single: { probability: 0.95 },
      clean: { probability: 0.95 },
      appetizing: { probability: 0.95 },
    })
    const landscape = verdictFromAnswers(item('l', 'Bruschetta', 1600, 1067), {
      subject: { probability: 0.95 },
      single: { probability: 0.95 },
      clean: { probability: 0.95 },
      appetizing: { probability: 0.95 },
    })
    expect(portrait.score).toBeLessThan(landscape.score)
  })
})
