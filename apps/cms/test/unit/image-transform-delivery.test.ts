import { describe, expect, it } from 'vitest'
import {
  clampDeliveryDimension,
  clampDeliveryQuality,
  imageDeliveryCacheRequest,
  imageDeliveryCacheTags,
  isAllowedMediaAssetPath,
  resolveDeliveryFormat,
  sanitizeDeliveryOperations,
} from '../../shared/image-delivery-policy'
import {
  buildIpxImagePath,
  hasImageTransformOps,
  parseIpxImagePath,
  parseIpxOperationsSegment,
} from '../../shared/ipx-image-path'
import { planDeliveryResize } from '../../shared/image-transform-delivery'

describe('image-delivery-policy', () => {
  it('clamps dimensions to max edge', () => {
    expect(clampDeliveryDimension(99999)).toBe(2560)
    expect(clampDeliveryDimension(400)).toBe(400)
  })

  it('clamps quality', () => {
    expect(clampDeliveryQuality(200)).toBe(100)
    expect(clampDeliveryQuality(undefined)).toBe(85)
  })

  it('resolves f_auto from Accept', () => {
    expect(resolveDeliveryFormat('auto', 'image/webp,*/*')).toBe('webp')
    expect(resolveDeliveryFormat('auto', 'image/jpeg,*/*')).toBe('jpeg')
  })

  it('strips unsupported modifiers', () => {
    expect(sanitizeDeliveryOperations({
      width: '400',
      rotate: '90',
      sharpen: '30',
    })).toEqual({ width: '400' })
  })

  it('validates media paths', () => {
    expect(isAllowedMediaAssetPath('uploads/a.webp')).toBe(true)
    expect(isAllowedMediaAssetPath('../etc/passwd')).toBe(false)
    expect(isAllowedMediaAssetPath('other/a.webp')).toBe(false)
  })

  it('normalizes cache keys without query', () => {
    expect(imageDeliveryCacheRequest('/images/w_400/x.webp').url).toBe(
      'https://image-cache.local/images/w_400/x.webp',
    )
  })

  it('builds cache tags for purge', () => {
    expect(imageDeliveryCacheTags('uploads/foo.webp')).toBe('media,media-path-uploads/foo.webp')
  })
})

describe('parseIpxImagePath', () => {
  it('parses IPX modifiers and asset path', () => {
    expect(parseIpxImagePath('w_800,f_webp/uploads/photo.webp')).toEqual({
      assetPath: 'uploads/photo.webp',
      operations: { width: '800', format: 'webp' },
      modifiersSegment: 'w_800,f_webp',
    })
  })

  it('treats _ as identity modifiers', () => {
    expect(parseIpxImagePath('_/uploads/photo.webp')).toEqual({
      assetPath: 'uploads/photo.webp',
      operations: {},
      modifiersSegment: '_',
    })
  })

  it('accepts paths without modifiers', () => {
    expect(parseIpxImagePath('uploads/photo.webp')).toEqual({
      assetPath: 'uploads/photo.webp',
      operations: {},
      modifiersSegment: null,
    })
  })

  it('parses s_WxH resize shorthand', () => {
    expect(parseIpxOperationsSegment('s_200x100,q_70')).toEqual({
      width: '200',
      height: '100',
      resize: '200x100',
      quality: '70',
    })
  })

  it('rebuilds paths for proxying', () => {
    expect(buildIpxImagePath('uploads/a.webp', 'w_400,f_webp')).toBe('w_400,f_webp/uploads/a.webp')
    expect(buildIpxImagePath('uploads/a.webp', null)).toBe('uploads/a.webp')
  })

  it('detects transform ops', () => {
    expect(hasImageTransformOps({ width: '100' })).toBe(true)
    expect(hasImageTransformOps({})).toBe(false)
  })
})

describe('planDeliveryResize', () => {
  it('scales by width when height is omitted', () => {
    expect(planDeliveryResize(2000, 1000, { width: 1000 })).toEqual({
      resizeWidth: 1000,
      resizeHeight: 500,
    })
  })

  it('uses contain for inside fit', () => {
    expect(planDeliveryResize(1600, 900, { width: 800, height: 600, fit: 'inside' })).toEqual({
      resizeWidth: 800,
      resizeHeight: 600,
      fitMethod: 'contain',
    })
  })

  it('plans cover crop to exact box', () => {
    expect(planDeliveryResize(1600, 900, { width: 800, height: 600, fit: 'cover' })).toEqual({
      resizeWidth: 1067,
      resizeHeight: 600,
      cropTo: { width: 800, height: 600 },
    })
  })

  it('plans outside without crop', () => {
    expect(planDeliveryResize(1600, 900, { width: 800, height: 600, fit: 'outside' })).toEqual({
      resizeWidth: 1067,
      resizeHeight: 600,
    })
  })

  it('does not upscale without enlarge', () => {
    expect(planDeliveryResize(800, 600, { width: 2000, allowUpscale: false })).toEqual({
      resizeWidth: 800,
      resizeHeight: 600,
    })
  })
})
