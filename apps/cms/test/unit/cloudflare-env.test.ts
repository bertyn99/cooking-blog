import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('nitropack/runtime', () => ({
  useEvent: () => {
    throw new Error('no request')
  },
}))

const { getCloudflareEnv } = await import('../../server/utils/cloudflare-env')

describe('getCloudflareEnv', () => {
  afterEach(() => {
    delete (globalThis as { __env__?: unknown }).__env__
  })

  it('reads Worker bindings from globalThis.__env__ when there is no request', () => {
    const env = { DB: { fake: true } }
    ;(globalThis as { __env__?: unknown }).__env__ = env

    expect(getCloudflareEnv()?.DB).toBe(env.DB)
  })

  it('returns undefined when cron/task context has no bindings', () => {
    expect(getCloudflareEnv()).toBeUndefined()
  })
})
