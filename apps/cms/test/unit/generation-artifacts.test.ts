import { describe, expect, it } from 'vitest'
import { createGenerationArtifactStore } from '../../server/services/generation/artifact-storage'
import { mkdtemp, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

describe('generation artifact storage', () => {
  it('writes JSON artifacts under generation prefix locally', async () => {
    const prev = process.cwd()
    const dir = await mkdtemp(join(tmpdir(), 'cms-gen-'))
    process.chdir(dir)

    try {
      const store = createGenerationArtifactStore()
      const key = await store.putJson('runs/test-run', 'normalize', { ok: true })
      expect(key).toContain('generation/runs/test-run/normalize.json')

      const roundTrip = await store.getJson<{ ok: boolean }>('runs/test-run', 'normalize')
      expect(roundTrip?.ok).toBe(true)

      const raw = await readFile(join(dir, '.data/generation/runs/test-run/normalize.json'), 'utf8')
      expect(JSON.parse(raw)).toEqual({ ok: true })
    }
    finally {
      process.chdir(prev)
    }
  })
})
