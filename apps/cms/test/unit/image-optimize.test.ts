import { describe, expect, it } from 'vitest'
import { pathnameWithWebpExtension, scaleToMaxEdge, shouldSkipImageOptimize } from '../../shared/image-optimize'

describe('image-optimize policy', () => {
  it('scales down longest edge', () => {
    expect(scaleToMaxEdge(4000, 2000, 2560)).toEqual({ width: 2560, height: 1280 })
  })

  it('rewrites extension to webp', () => {
    expect(pathnameWithWebpExtension('uploads/photo.jpg')).toBe('uploads/photo.webp')
  })

  it('skips small webp', () => {
    expect(shouldSkipImageOptimize('image/webp', 100_000)).toBe(true)
    expect(shouldSkipImageOptimize('image/webp', 600_000)).toBe(false)
  })
})
