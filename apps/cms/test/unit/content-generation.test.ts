import { describe, expect, it } from 'vitest'
import { GENERATION_STEP_KEYS } from '../../server/db/queries/content-generation'

describe('content generation pipeline', () => {
  it('defines the PR3 step machine keys in order', () => {
    expect(GENERATION_STEP_KEYS).toEqual([
      'normalize',
      'classify',
      'extract',
      'assemble',
      'validate',
      'generate_cover',
    ])
  })
})
