import { describe, expect, it } from 'vitest'
import {
  contentImageAspectClass,
  contentImageClassList,
  isEmptyOrGenericImageAlt,
  isLikelyBrokenContentImageSrc,
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
    expect(contentImageAspectClass(null)).toBeNull()
    expect(contentImageAspectClass(null, '4:3')).toContain('4/3')
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

  it('uses full width by default and aspect only when title sets a ratio', () => {
    const natural = contentImageClassList(null)
    expect(natural).toContain('w-full')
    expect(natural).not.toContain('w-4/5')
    expect(natural).toContain('h-auto')
    expect(natural).not.toMatch(/aspect-/)

    const cropped = contentImageClassList('16:9')
    expect(cropped).toContain('w-full')
    expect(cropped).toContain('aspect-[16/9]')
    expect(cropped).toContain('object-cover')
    expect(cropped).not.toContain('h-auto')
  })

  it('flags orphan public image paths as broken', () => {
    expect(isLikelyBrokenContentImageSrc('/images/aperitif-portugais/caldo-verde.jpg')).toBe(true)
    expect(isLikelyBrokenContentImageSrc('/images/uploads/ok.webp')).toBe(false)
    expect(isLikelyBrokenContentImageSrc('blob:http://localhost/1')).toBe(false)
    expect(isLikelyBrokenContentImageSrc('')).toBe(true)
  })
})
