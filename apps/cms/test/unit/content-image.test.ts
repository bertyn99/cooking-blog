import { describe, expect, it } from 'vitest'
import {
  contentImageAspectClass,
  contentImageClassList,
  isEmptyOrGenericImageAlt,
  iterateMarkdownImages,
  parseImageAspectFromTitle,
  pathnameFromContentImageSrc,
  serializeMarkdownImage,
} from '../../shared/content-image'

describe('content-image', () => {
  it('parses aspect from markdown title', () => {
    expect(parseImageAspectFromTitle('16:9')).toBe('16:9')
    expect(parseImageAspectFromTitle('caption')).toBeNull()
    expect(contentImageAspectClass('16:9')).toContain('16/9')
    expect(contentImageAspectClass(null)).toContain('4/3')
  })

  it('maps CMS image URLs to uploads pathname', () => {
    expect(pathnameFromContentImageSrc('/images/uploads/foo.webp')).toBe('uploads/foo.webp')
    expect(pathnameFromContentImageSrc('/images/w_400,f_webp/uploads/foo.webp')).toBe('uploads/foo.webp')
    expect(pathnameFromContentImageSrc('/uploads/foo.webp')).toBe('uploads/foo.webp')
  })

  it('serializes and iterates markdown images', () => {
    const md = serializeMarkdownImage({
      alt: 'Pastéis',
      src: '/images/uploads/a.webp',
      title: '16:9',
    })
    expect(md).toBe('![Pastéis](/images/uploads/a.webp "16:9")')
    const images = iterateMarkdownImages(`${md}\n![](/images/uploads/b.webp)`)
    expect(images).toHaveLength(2)
    expect(images[1]?.alt).toBe('')
  })

  it('detects empty or generic alts', () => {
    expect(isEmptyOrGenericImageAlt('')).toBe(true)
    expect(isEmptyOrGenericImageAlt('image')).toBe(true)
    expect(isEmptyOrGenericImageAlt('Pastéis de Bacalhau')).toBe(false)
  })

  it('builds editor class list with aspect', () => {
    expect(contentImageClassList('16:9')).toContain('aspect-[16/9]')
    expect(contentImageClassList('16:9')).toContain('cms-editor-image')
    expect(contentImageClassList(null)).toContain('aspect-[4/3]')
  })
})
