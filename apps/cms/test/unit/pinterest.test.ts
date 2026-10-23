import { describe, expect, it } from 'vitest'
import {
  buildNotBeforeSchedule,
  buildPinCopyPrompt,
  buildPinImageUrl,
  extractContentImagePaths,
  fallbackPinCopy,
  parsePinCopyResponse,
} from '../../server/utils/pinterest'

describe('extractContentImagePaths', () => {
  it('extracts uploads images from markdown and dedupes', () => {
    const md = [
      'Intro',
      '![Coriandre fraîche](/uploads/2026/coriandre.webp)',
      'Suite ![autre](/images/w_800/uploads/autre.png) texte',
      '![Coriandre fraîche](/uploads/2026/coriandre.webp)',
    ].join('\n')
    expect(extractContentImagePaths(md)).toEqual([
      'uploads/2026/coriandre.webp',
      'uploads/autre.png',
    ])
  })

  it('ignores external images and non-media links', () => {
    const md = [
      '![ext](https://cdn.exemple.com/a.jpg)',
      '[un lien](/blog/toto)',
      '![absolue](https://journalducuistot.fr/images/_/uploads/x.webp)',
    ].join('\n')
    expect(extractContentImagePaths(md)).toEqual([])
  })

  it('returns empty for null/undefined content', () => {
    expect(extractContentImagePaths(null)).toEqual([])
    expect(extractContentImagePaths(undefined)).toEqual([])
  })
})

describe('buildNotBeforeSchedule', () => {
  it('spaces consecutive pins 72h apart (same-URL rule)', () => {
    const from = new Date('2026-10-23T12:00:00.000Z')
    const schedule = buildNotBeforeSchedule(3, from)
    expect(schedule).toHaveLength(3)
    expect(schedule[0]).toBe('2026-10-23T12:00:00.000Z')
    expect(schedule[1]).toBe('2026-10-26T12:00:00.000Z')
    expect(schedule[2]).toBe('2026-10-29T12:00:00.000Z')
  })
})

describe('buildPinImageUrl', () => {
  it('serves a 2:3 (1000×1500) crop through the site image pipeline', () => {
    expect(buildPinImageUrl('https://journalducuistot.fr/', 'uploads/a.webp'))
      .toBe('https://journalducuistot.fr/images/w_1000,h_1500/uploads/a.webp')
  })
})

describe('pin copy', () => {
  const input = {
    title: 'Coriandre : tout savoir',
    excerpt: 'La coriandre, ses usages et ses bienfaits en cuisine.',
    isCover: true,
  }

  it('parses a well-formed AI response', () => {
    const parsed = parsePinCopyResponse(
      'TITRE: Coriandre fraîche | Tout savoir sur ses usages\nDESCRIPTION: Découvrez la coriandre : usages, conservation et bienfaits pour réussir tous vos plats du quotidien.',
      input,
    )
    expect(parsed.title).toContain('Coriandre')
    expect(parsed.description.length).toBeGreaterThanOrEqual(40)
  })

  it('falls back deterministically on a malformed response', () => {
    const parsed = parsePinCopyResponse('je ne sais pas', input)
    expect(parsed.title).toBe(input.title.slice(0, 100))
    expect(parsed.description).toContain(input.title)
  })

  it('fallback copy respects Pinterest length limits', () => {
    const long = { ...input, title: 'T'.repeat(300), excerpt: 'E'.repeat(500) }
    const parsed = fallbackPinCopy(long)
    expect(parsed.title.length).toBeLessThanOrEqual(100)
    expect(parsed.description.length).toBeLessThanOrEqual(200)
  })

  it('prompt encodes the pinterest-seo title format + no-hashtag rule', () => {
    const prompt = buildPinCopyPrompt(input)
    expect(prompt).toContain('Mot-clé principal | Bénéfice | Contexte')
    expect(prompt).toContain('hashtags')
    expect(prompt).toContain(input.title)
  })
})
