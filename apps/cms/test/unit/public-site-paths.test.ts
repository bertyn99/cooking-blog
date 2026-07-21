import { describe, expect, it } from 'vitest'
import { articlePublicPath, pagePublicPath, recipePublicPath } from '../../shared/public-site-paths'

describe('public-site-paths', () => {
  it('builds nested page paths', () => {
    expect(pagePublicPath('child', { slug: 'parent' })).toBe('/parent/child')
    expect(pagePublicPath('leaf', {
      slug: 'mid',
      parent: { slug: 'root' },
    })).toBe('/root/mid/leaf')
  })

  it('builds article and recipe paths', () => {
    expect(articlePublicPath('mon-article', 'desserts')).toBe('/blog/desserts/mon-article')
    expect(recipePublicPath('tarte')).toBe('/recette/tarte')
  })
})
