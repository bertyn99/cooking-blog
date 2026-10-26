import { afterEach, describe, expect, it } from 'vitest'
import { getCloudflareEnv } from '../../server/utils/cloudflare-env'

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
