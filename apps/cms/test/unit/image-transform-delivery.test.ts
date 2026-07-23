import { describe, expect, it } from 'vitest'
import { planDeliveryResize } from '../../shared/image-transform-delivery'

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
})
