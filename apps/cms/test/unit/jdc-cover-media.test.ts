import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const coverMediaPath = fileURLToPath(
  new URL('../../../../packages/shared/app/components/JdcCoverMedia.vue', import.meta.url)
)

describe('JdcCoverMedia', () => {
  it('does not mention NuxtImg in source (NUXT_B3004 on hosts without @nuxt/image)', () => {
    const source = readFileSync(coverMediaPath, 'utf8')
    expect(source).not.toMatch(/\bNuxtImg\b/)
  })
})
