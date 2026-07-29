import { describe, expect, it } from 'vitest'
import { imageDeliveryCacheTagList } from '../../server/utils/workers-image-cache'

describe('workers-image-cache', () => {
  it('splits cache tags for purge API', () => {
    expect(imageDeliveryCacheTagList('uploads/a.webp')).toEqual([
      'media',
      'media-path-uploads/a.webp',
    ])
  })
})
