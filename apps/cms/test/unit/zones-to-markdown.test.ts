import { describe, expect, it } from 'vitest'
import { strapiZonesToMarkdown } from '../../server/services/extract/zones-to-markdown'

describe('strapiZonesToMarkdown', () => {
  it('concatenates ui.text blocks', () => {
    const markdown = strapiZonesToMarkdown([
      { __component: 'ui.text', content: '# Titre\n\nParagraphe.' },
      { __component: 'ui.divider' },
      { __component: 'ui.text', content: 'Suite.' },
    ])

    expect(markdown).toContain('# Titre')
    expect(markdown).toContain('---')
    expect(markdown).toContain('Suite.')
  })

  it('renders images as markdown links', () => {
    const markdown = strapiZonesToMarkdown([
      {
        __component: 'ui.image',
        url: '/uploads/demo.webp',
        alternativeText: 'Démo',
      },
    ])

    expect(markdown).toBe('![Démo](/uploads/demo.webp)')
  })
})
