import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/** Load key=value lines from `.env` without overriding existing `process.env`. */
export function loadEnvFiles(paths: string[]) {
  for (const filePath of paths) {
    if (!existsSync(filePath)) continue
    const text = readFileSync(filePath, 'utf8')
    for (const line of text.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq <= 0) continue
      const key = trimmed.slice(0, eq).trim()
      let value = trimmed.slice(eq + 1).trim()
      if (
        (value.startsWith('"') && value.endsWith('"'))
        || (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1)
      }
      if (process.env[key] === undefined) {
        process.env[key] = value
      }
    }
  }
}

export function loadCmsCloneEnv(cwd = process.cwd()) {
  loadEnvFiles([
    resolve(cwd, '.env'),
    resolve(cwd, '../../.env'),
  ])
}
