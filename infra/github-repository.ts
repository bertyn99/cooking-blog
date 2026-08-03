import { execSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { loadEnvFile } from 'node:process'
import * as Effect from 'effect/Effect'

/** Load repo-root `.env` into `process.env` (Alchemy CLI does not do this automatically). */
export function loadProjectEnv(): void {
  if (!existsSync('.env')) {
    return
  }
  try {
    loadEnvFile('.env')
  } catch {
    // Missing or unreadable — ignore.
  }
}

export function parseGitHubRemoteUrl(url: string): { owner: string, repository: string } | null {
  const trimmed = url.trim().replace(/\.git$/, '')
  const match = trimmed.match(/github\.com[/:]([^/]+)\/([^/]+)$/)
  if (!match?.[1] || !match[2]) {
    return null
  }
  return { owner: match[1], repository: match[2] }
}

export function readOriginGitHubRepository(): { owner: string, repository: string } | null {
  try {
    const url = execSync('git config --get remote.origin.url', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
    return parseGitHubRemoteUrl(url) ?? null
  } catch {
    return null
  }
}

export function resolveGitHubRepository(): { owner: string, repository: string } {
  loadProjectEnv()

  const owner = process.env.ALCHEMY_GITHUB_OWNER?.trim()
  const repository = process.env.ALCHEMY_GITHUB_REPOSITORY?.trim()
  if (owner && repository) {
    return { owner, repository }
  }

  const githubRepository = process.env.GITHUB_REPOSITORY?.trim()
  if (githubRepository?.includes('/')) {
    const [fromEnvOwner, fromEnvRepo] = githubRepository.split('/', 2)
    if (fromEnvOwner && fromEnvRepo) {
      return { owner: fromEnvOwner, repository: fromEnvRepo }
    }
  }

  const fromGit = readOriginGitHubRepository()
  if (fromGit) {
    return fromGit
  }

  throw new Error(
    'Could not resolve GitHub repository. Set ALCHEMY_GITHUB_OWNER and ALCHEMY_GITHUB_REPOSITORY '
    + 'in .env, set GITHUB_REPOSITORY, or use a github.com git remote.',
  )
}

export const githubRepositoryEffect = Effect.sync(() => resolveGitHubRepository())
