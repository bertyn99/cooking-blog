import * as Cloudflare from 'alchemy/Cloudflare'
import * as Command from 'alchemy/Command'
import * as Config from 'effect/Config'
import * as Effect from 'effect/Effect'

const NODE_COMPAT = {
  date: '2025-01-15',
  flags: ['nodejs_compat'],
}

const PUBLISH_CRON = '*/5 * * * *'

export const workers = Effect.fn(function* (input: {
  DB: Cloudflare.D1.Database
  AiReadyDB: Cloudflare.D1.Database
  Media: Cloudflare.R2.Bucket
  Cache: Cloudflare.KV.Namespace
}) {
  const cmsBuild = yield* Command.Build('cms-build', {
    command: 'pnpm --filter cms build',
    cwd: '.',
    outdir: 'apps/cms/.output',
    memo: {
      include: ['apps/cms/**', 'pnpm-lock.yaml', 'pnpm-workspace.yaml'],
      exclude: ['apps/cms/.data', 'apps/cms/coverage', 'apps/cms/.nuxt'],
    },
  })

  const Cms = yield* Cloudflare.Worker('Cms', {
    bundle: false,
    main: 'apps/cms/.output/server/index.mjs',
    env: {
      DB: input.DB,
      Media: input.Media,
      Cache: input.Cache,
      NUXT_SESSION_PASSWORD: Config.string('NUXT_SESSION_PASSWORD'),
    },
    crons: [PUBLISH_CRON],
    compatibility: NODE_COMPAT,
    assets: {
      directory: 'apps/cms/.output/public',
      hash: cmsBuild.hash,
    },
    dev: {
      mode: 'external',
      url: 'http://localhost:3001',
    },
  })

  const webBuild = yield* Command.Build('web-build', {
    command: 'pnpm --filter web build',
    cwd: '.',
    outdir: 'apps/web/.output',
    memo: {
      include: ['apps/web/**', 'pnpm-lock.yaml', 'pnpm-workspace.yaml'],
      exclude: ['apps/web/.nuxt', 'apps/web/.cache'],
    },
  })

  const SkewProtection = yield* Cloudflare.KV.Namespace('WebSkewProtection', {})

  const Web = yield* Cloudflare.Worker('Web', {
    bundle: false,
    main: 'apps/web/.output/server/index.mjs',
    env: {
      Cache: input.Cache,
      AI_READY_DB: input.AiReadyDB,
      SKEW_PROTECTION: SkewProtection,
      CMS_BASE_URL: Config.string('CMS_BASE_URL').pipe(
        Config.withDefault('http://localhost:3001'),
      ),
      NUXT_PUBLIC_CMS_BASE_URL: Config.string('NUXT_PUBLIC_CMS_BASE_URL').pipe(
        Config.withDefault('http://localhost:3001'),
      ),
      NUXT_PUBLIC_SITE_URL: Config.string('NUXT_PUBLIC_SITE_URL').pipe(
        Config.withDefault('https://journalducuistot.fr'),
      ),
    },
    compatibility: NODE_COMPAT,
    assets: {
      directory: 'apps/web/.output/public',
      hash: webBuild.hash,
    },
    dev: {
      mode: 'external',
      url: 'http://localhost:3000',
    },
  })

  return { Cms, Web }
})
