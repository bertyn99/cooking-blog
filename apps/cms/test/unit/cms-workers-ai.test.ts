import { describe, expect, it } from 'vitest'
import { createCmsWorkersAI } from '../../server/utils/cms-workers-ai'

describe('createCmsWorkersAI', () => {
  it('creates a provider without throwing when gateway is disabled', () => {
    const fakeAi = {} as Ai
    expect(() => createCmsWorkersAI(fakeAi, { gatewayId: null })).not.toThrow()
    expect(() => createCmsWorkersAI(fakeAi, { gatewayId: '' })).not.toThrow()
  })

  it('accepts metadata and cache options with a gateway id', () => {
    const fakeAi = {} as Ai
    expect(() => createCmsWorkersAI(fakeAi, {
      gatewayId: 'jdc-cms-ai',
      metadata: { surface: 'test', mode: 'fix' },
      cacheTtl: 60,
    })).not.toThrow()
  })
})
