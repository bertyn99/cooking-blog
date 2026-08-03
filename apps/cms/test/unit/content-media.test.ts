import { describe, expect, it } from 'vitest'
import { extractUploadPathsFromText } from '../../server/services/extract/content-media'
import { canonicalStrapiUploadPath } from '../../server/utils/media-storage'

describe('extractUploadPathsFromText', () => {
  it('finds relative and absolute Strapi upload paths', () => {
    const text = `
![x](/uploads/foo.webp)
<img src="https://admin.journalducuistot.fr/uploads/bar.png" />
![y](/uploads/width_410,height_287,fit_cover/uploads/nested_abc.webp)
`
    const paths = extractUploadPathsFromText(text)
    expect(paths).toContain('/uploads/foo.webp')
    expect(paths).toContain('/uploads/bar.png')
    expect(paths).toContain('/uploads/width_410,height_287,fit_cover/uploads/nested_abc.webp')
  })

  it('ignores CMS rewritten /images/uploads/ paths', () => {
    const text = `![x](/images/uploads/foo.webp)\n![y](/uploads/still-pending.png)`
    const paths = extractUploadPathsFromText(text)
    expect(paths).not.toContain('/uploads/foo.webp')
    expect(paths).toContain('/uploads/still-pending.png')
  })
})

describe('canonicalStrapiUploadPath', () => {
  it('keeps simple upload paths', () => {
    expect(canonicalStrapiUploadPath('/uploads/foo.webp')).toBe('/uploads/foo.webp')
  })

  it('strips Strapi transform prefix to original file', () => {
    expect(
      canonicalStrapiUploadPath('/uploads/width_410,height_287,fit_cover/uploads/nested_abc.webp'),
    ).toBe('/uploads/nested_abc.webp')
  })

  it('normalizes absolute Strapi URLs', () => {
    expect(
      canonicalStrapiUploadPath(
        'https://admin.journalducuistot.fr/uploads/width_100/uploads/bar.png',
      ),
    ).toBe('/uploads/bar.png')
  })
})
