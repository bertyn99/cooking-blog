import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import type { H3Event } from 'h3'
import type { GenerationStepKey } from '../../db/queries/content-generation'
import { useR2 } from '../../utils/r2'

function localGenerationRoot() {
  return join(process.cwd(), '.data/generation')
}

function objectKey(artifactPrefix: string, stepKey: GenerationStepKey | 'source-pack') {
  const normalized = artifactPrefix.replace(/^\/+|\/+$/g, '')
  return `${normalized}/${stepKey}.json`
}

function r2ObjectKey(artifactPrefix: string, stepKey: GenerationStepKey | 'source-pack') {
  return `generation/${objectKey(artifactPrefix, stepKey)}`
}

function localPath(artifactPrefix: string, stepKey: GenerationStepKey | 'source-pack') {
  return join(localGenerationRoot(), objectKey(artifactPrefix, stepKey))
}

export interface GenerationArtifactStore {
  putJson(artifactPrefix: string, stepKey: GenerationStepKey | 'source-pack', value: unknown): Promise<string>
  getJson<T = unknown>(artifactPrefix: string, stepKey: GenerationStepKey | 'source-pack'): Promise<T | null>
}

export function createGenerationArtifactStore(r2?: R2Bucket): GenerationArtifactStore {
  return {
    async putJson(artifactPrefix, stepKey, value) {
      const key = r2ObjectKey(artifactPrefix, stepKey)
      const body = JSON.stringify(value)

      if (r2) {
        await r2.put(key, body, { httpMetadata: { contentType: 'application/json' } })
        return key
      }

      const path = localPath(artifactPrefix, stepKey)
      await mkdir(dirname(path), { recursive: true })
      await writeFile(path, body, 'utf8')
      return key
    },

    async getJson(artifactPrefix, stepKey) {
      if (r2) {
        const key = r2ObjectKey(artifactPrefix, stepKey)
        const object = await r2.get(key)
        if (!object) {
          return null
        }
        const text = await object.text()
        return JSON.parse(text) as unknown
      }

      try {
        const text = await readFile(localPath(artifactPrefix, stepKey), 'utf8')
        return JSON.parse(text) as unknown
      }
      catch {
        return null
      }
    },
  }
}

export function useGenerationArtifactStore(event?: H3Event): GenerationArtifactStore {
  return createGenerationArtifactStore(useR2(event))
}
