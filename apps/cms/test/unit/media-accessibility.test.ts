import { describe, expect, it } from 'vitest'
import {
  blobDefaultDescription,
  blobToStrapiCover,
  resolveCoverAlt,
  resolveCoverDescription,
} from '../../shared/media-accessibility'

describe('media-accessibility', () => {
  it('resolves alt with override, blob, then title', () => {
    expect(resolveCoverAlt({ altOverride: 'Custom', blobAlt: 'Blob', titleFallback: 'Title' })).toBe('Custom')
    expect(resolveCoverAlt({ altOverride: null, blobAlt: 'Blob', titleFallback: 'Title' })).toBe('Blob')
    expect(resolveCoverAlt({ altOverride: null, blobAlt: null, titleFallback: 'Title' })).toBe('Title')
  })

  it('resolves description from override or blob metadata', () => {
    expect(resolveCoverDescription({
      descriptionOverride: 'Page-specific',
      metadata: { description: 'File desc' },
    })).toBe('Page-specific')
    expect(resolveCoverDescription({
      descriptionOverride: null,
      metadata: { caption: 'Légende' },
    })).toBe('Légende')
    expect(blobDefaultDescription({ description: 'D', caption: 'C' })).toBe('D')
  })

  it('maps blob rows to Strapi-like cover', () => {
    const cover = blobToStrapiCover({
      pathname: 'uploads/abc123.webp',
      originalName: 'photo.webp',
      mimeType: 'image/webp',
      width: 800,
      height: 600,
      altText: 'From Strapi',
      fileMetadata: { description: 'Studio shot' },
    }, {
      altOverride: null,
      descriptionOverride: null,
      titleFallback: 'Article title',
    })

    expect(cover.alternativeText).toBe('From Strapi')
    expect(cover.caption).toBe('Studio shot')
    expect(cover.hash).toBe('abc123')
    expect(cover.ext).toBe('.webp')
    expect(cover.url).toBe('/uploads/abc123.webp')
  })
})
