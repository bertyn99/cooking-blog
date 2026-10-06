import { describe, expect, it } from 'vitest'
import { cmsPageCanonicalPath, cmsPageMatchesRequestPath, normalizePagePath } from '../../app/utils/format'

describe('cmsPageCanonicalPath', () => {
  it('keeps root slugs at the site root', () => {
    expect(cmsPageCanonicalPath('a-propos', null)).toBe('/a-propos')
  })

  it('prefixes nested CMS pages with parent slugs', () => {
    expect(
      cmsPageCanonicalPath('recettes-du-monde', {
        slug: 'recette',
        parent: null,
      }),
    ).toBe('/recette/recettes-du-monde')
  })

  it('walks multi-level parent chains', () => {
    expect(
      cmsPageCanonicalPath('methodes-de-cuisson', {
        slug: 'techniques-culinaires',
        parent: null,
      }),
    ).toBe('/techniques-culinaires/methodes-de-cuisson')
  })

  it('uses / for home regardless of slug', () => {
    expect(cmsPageCanonicalPath('accueil', null, { isHome: true })).toBe('/')
  })
})

describe('cmsPageMatchesRequestPath', () => {
  const nested = {
    slug: 'methodes-de-cuisson',
    parent: { slug: 'techniques-culinaires', parent: null },
  }

  it('404s a nested page at the truncated slug', () => {
    expect(cmsPageMatchesRequestPath(nested, '/methodes-de-cuisson')).toBe(false)
  })

  it('accepts the full ancestor path', () => {
    expect(
      cmsPageMatchesRequestPath(nested, '/techniques-culinaires/methodes-de-cuisson'),
    ).toBe(true)
  })

  it('rejects a wrong ancestor prefix (3+ segments)', () => {
    const leaf = {
      slug: 'guide-braisage',
      parent: {
        slug: 'methodes-de-cuisson',
        parent: { slug: 'techniques-culinaires' },
      },
    }
    expect(
      cmsPageMatchesRequestPath(leaf, '/wrong/methodes-de-cuisson/guide-braisage'),
    ).toBe(false)
    expect(
      cmsPageMatchesRequestPath(
        leaf,
        '/techniques-culinaires/methodes-de-cuisson/guide-braisage',
      ),
    ).toBe(true)
  })

  it('matches root pages only at /{slug}', () => {
    expect(cmsPageMatchesRequestPath({ slug: 'a-propos', parent: null }, '/a-propos')).toBe(true)
    expect(cmsPageMatchesRequestPath({ slug: 'a-propos', parent: null }, '/other/a-propos')).toBe(false)
  })

  it('matches home only at /', () => {
    expect(cmsPageMatchesRequestPath({ slug: 'accueil', isHome: true }, '/')).toBe(true)
    expect(cmsPageMatchesRequestPath({ slug: 'accueil', isHome: true }, '/accueil')).toBe(false)
  })
})

describe('normalizePagePath', () => {
  it('strips duplicate slashes and trailing slash', () => {
    expect(normalizePagePath('//foo/bar//')).toBe('/foo/bar')
  })
})
