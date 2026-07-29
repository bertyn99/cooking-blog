import { afterEach, describe, expect, it } from 'vitest'
import { prefersD1Database } from '../../server/utils/db'

describe('prefersD1Database', () => {
  const env = process.env

  afterEach(() => {
    process.env = { ...env }
  })

  it('uses libSQL in development by default', () => {
    process.env.NODE_ENV = 'development'
    delete process.env.CMS_USE_D1
    expect(prefersD1Database()).toBe(false)
  })

  it('uses D1 in production', () => {
    process.env.NODE_ENV = 'production'
    delete process.env.CMS_USE_D1
    expect(prefersD1Database()).toBe(true)
  })

  it('allows forcing D1 in development', () => {
    process.env.NODE_ENV = 'development'
    process.env.CMS_USE_D1 = 'true'
    expect(prefersD1Database()).toBe(true)
  })
})
