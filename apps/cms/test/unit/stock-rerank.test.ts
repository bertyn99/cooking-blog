import { describe, expect, it } from 'vitest'
import { normalizeVerdicts } from '../../server/services/stock/rerank'
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
    expect(ranking[1].score).toBe(0)
    expect(ranking[1].keep).toBe(false)
    expect(ranking[2].score).toBe(-1)
  })

  it('appends skipped candidates at the tail in provider order', () => {
    const ranking = normalizeVerdicts(items, [
      { id: 'b', score: 2, keep: false, reason: 'Hors sujet' },
    ])
    expect(ranking.map(r => r.id)).toEqual(['b', 'a', 'c'])
    expect(ranking[1].score).toBe(-1)
    expect(ranking[1].reason).toContain('Non évalué')
  })

  it('keeps every candidate when the model returns nothing', () => {
    const ranking = normalizeVerdicts(items, [])
    expect(ranking).toHaveLength(3)
    expect(ranking.every(r => r.keep)).toBe(true)
    expect(ranking.every(r => r.score === -1)).toBe(true)
  })

  it('falls back to a default reason when missing or blank', () => {
    const ranking = normalizeVerdicts(items, [{ id: 'a', score: 7, keep: true, reason: '   ' }])
    expect(ranking[0].reason).toBe('Sans justification du modèle.')
  })
})
