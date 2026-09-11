import { describe, expect, it } from 'vitest'
import { buildMcpContentLinks } from '../../server/mcp/utils/preview'
import { previewTokenMatches } from '../../server/utils/preview-auth'

describe('buildMcpContentLinks', () => {
  it('builds article preview and public urls', () => {
    const links = buildMcpContentLinks({
      siteOrigin: 'http://localhost:3000',
      kind: 'article',
      slug: 'tarte-citron',
      status: 'published',
      categorySlug: 'desserts',
    })
    expect(links.previewUrl).toBe(
      'http://localhost:3000/preview?type=article&slug=desserts%2Ftarte-citron',
    )
    expect(links.publicUrl).toBe('http://localhost:3000/blog/desserts/tarte-citron')
  })

  it('omits publicUrl for drafts', () => {
    const links = buildMcpContentLinks({
      siteOrigin: 'https://journalducuistot.fr',
      kind: 'page',
      slug: 'mentions-legales',
      status: 'draft',
    })
    expect(links.previewUrl).toBe(
      'https://journalducuistot.fr/preview?type=page&slug=mentions-legales',
    )
    expect(links.publicUrl).toBeNull()
  })

  it('nests page preview slugs from parent chain', () => {
    const links = buildMcpContentLinks({
      siteOrigin: 'http://localhost:3000',
      kind: 'page',
      slug: 'child',
      status: 'published',
      parent: { slug: 'parent' },
    })
    expect(links.previewUrl).toBe(
      'http://localhost:3000/preview?type=page&slug=parent%2Fchild',
    )
    expect(links.publicUrl).toBe('http://localhost:3000/parent/child')
  })
})

describe('previewTokenMatches', () => {
  it('rejects empty or mismatched tokens', () => {
    expect(previewTokenMatches('secret', 'secret')).toBe(true)
    expect(previewTokenMatches('secret', 'other')).toBe(false)
    expect(previewTokenMatches('', 'secret')).toBe(false)
    expect(previewTokenMatches('secret', '')).toBe(false)
  })
})
