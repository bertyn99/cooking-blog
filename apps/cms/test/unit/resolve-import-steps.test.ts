import { describe, expect, it } from 'vitest'
import { resolveImportSteps } from '../../shared/strapi-import'

describe('resolveImportSteps', () => {
  it('includes category-articles when importing articles only', () => {
    expect(resolveImportSteps(['articles'])).toEqual([
      'category-articles',
      'articles',
    ])
  })

  it('includes categories when importing recipes only', () => {
    expect(resolveImportSteps(['recipes'])).toEqual([
      'categories',
      'recipes',
    ])
  })

  it('preserves canonical order', () => {
    expect(resolveImportSteps(['pages', 'articles', 'category-articles'])).toEqual([
      'category-articles',
      'articles',
      'pages',
    ])
  })

  it('skips dependencies when omitDependencies is true', () => {
    expect(resolveImportSteps(['articles'], { omitDependencies: true })).toEqual(['articles'])
  })
})
