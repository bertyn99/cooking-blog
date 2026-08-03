import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { transformImageBufferForDelivery } from '../../shared/image-transform-delivery'

describe('jsquash in Node', () => {
  it('resizes WebP for delivery thumbnails', async () => {
    const sample = readFileSync(
      new URL('../../.data/media/uploads/marinade_4f5d3b6e7d.webp', import.meta.url),
    )
    const buffer = sample.buffer.slice(sample.byteOffset, sample.byteOffset + sample.byteLength)
    const result = await transformImageBufferForDelivery(
      buffer,
      'image/webp',
      { width: '400', format: 'webp', quality: '80' },
    )
    expect(result).not.toBeNull()
    expect(result!.buffer.byteLength).toBeLessThan(buffer.byteLength)
    expect(result!.contentType).toBe('image/webp')
  })
})
