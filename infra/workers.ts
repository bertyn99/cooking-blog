import * as Cloudflare from 'alchemy/Cloudflare'
import * as Command from 'alchemy/Command'
import * as Output from 'alchemy/Output'
import { Stage } from 'alchemy/Stage'
import * as Config from 'effect/Config'
import * as Effect from 'effect/Effect'
import { CMS_AI_GATEWAY_ID } from '../apps/cms/shared/workers-ai-model.ts'

/** Production custom domains (`stage === prod` only). Zone must exist on the Cloudflare account. */
const PROD_WEB_HOST = 'journalducuistot.fr'
const PROD_CMS_HOST = 'admin.journalducuistot.fr'

const NODE_COMPAT = {
  date: '2025-01-15',
  flags: ['nodejs_compat'],
}

const WEB_NODE_COMPAT = {
  date: '2026-05-27',
  flags: ['nodejs_compat_v2'],
}

const PUBLISH_CRON = '*/5 * * * *'

const CMS_WORKERS_CACHE = {
  enabled: true,
  crossVersionCache: true,
} as const

export const workers = Effect.fn(function* (input: {
  DB: Cloudflare.D1.Database
  AiReadyDB: Cloudflare.D1.Database
  Media: Cloudflare.R2.Bucket
  Cache: Cloudflare.KV.Namespace
}) {
  const stage = yield* Stage
  const isProd = stage === 'prod'
  const prodCmsOrigin = `https://${PROD_CMS_HOST}`
  const cmsDomain = isProd ? PROD_CMS_HOST : undefined
  const webDomain = isProd ? PROD_WEB_HOST : undefined

  const cmsBuild = yield* Command.Build('cms-build', {
    command: 'pnpm --filter cms build',
    cwd: '.',
    outdir: 'apps/cms/.output',
    memo: {
      include: ['apps/cms/**', 'pnpm-lock.yaml', 'pnpm-workspace.yaml'],
      exclude: ['apps/cms/.data', 'apps/cms/coverage', 'apps/cms/.nuxt'],
    },
  })

  // AI Gateway + Workers AI binding (env.AI). Gateway id must match app `CMS_AI_GATEWAY_ID`.
  const CmsAi = yield* Cloudflare.AI.Gateway('CmsAi', {
    id: CMS_AI_GATEWAY_ID,
    collectLogs: true,
  })

  const ContentGeneration = Cloudflare.Workflow<
    { runId: string }
  >('ContentGeneration', {
    className: 'ContentGenerationWorkflow',
  })

  const Cms = yield* Cloudflare.Worker('Cms', {
    bundle: false,
    main: 'apps/cms/.output/server/index.mjs',
    domain: cmsDomain,
    cache: CMS_WORKERS_CACHE,
    env: {
      DB: input.DB,
      Media: input.Media,
      Cache: input.Cache,
      AI: CmsAi,
      CMS_AI_GATEWAY_ID: Config.string('CMS_AI_GATEWAY_ID').pipe(
        Config.withDefault(CMS_AI_GATEWAY_ID),
      ),
      CONTENT_GENERATION: ContentGeneration,
      NUXT_SESSION_PASSWORD: Config.string('NUXT_SESSION_PASSWORD'),
      NUXT_OG_IMAGE_SECRET: Config.string('NUXT_OG_IMAGE_SECRET').pipe(
        Config.withDefault(''),
      ),
      STRAPI_URL: Config.string('STRAPI_URL').pipe(Config.withDefault('')),
      STRAPI_API_TOKEN: Config.string('STRAPI_API_TOKEN').pipe(
        Config.withDefault(''),
      ),
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

  // Prod → custom CMS host; preview / local → Cms.url (workers.dev or alchemy.dev localhost).
  const cmsOriginOverride = yield* Config.string('CMS_BASE_URL').pipe(Config.option)
  const cmsPublicOverride = yield* Config.string('NUXT_PUBLIC_CMS_BASE_URL').pipe(
    Config.option,
  )
  const cmsWorkerOrigin = Output.map(
    Cms.url,
    (url) => url ?? 'http://localhost:3001',
  )
  const defaultCmsOrigin = isProd ? prodCmsOrigin : cmsWorkerOrigin
  const cmsBaseUrl =
    cmsOriginOverride._tag === 'Some' ? cmsOriginOverride.value : defaultCmsOrigin
  const cmsPublicUrl =
    cmsPublicOverride._tag === 'Some' ? cmsPublicOverride.value : defaultCmsOrigin
  const siteUrl = isProd
    ? `https://${PROD_WEB_HOST}`
    : Config.string('NUXT_PUBLIC_SITE_URL').pipe(
        Config.withDefault('http://localhost:3000'),
      )
  const ogImageSecret = Config.string('NUXT_OG_IMAGE_SECRET').pipe(
    Config.withDefault(''),
  )

  const SkewProtection = yield* Cloudflare.KV.Namespace('WebSkewProtection', {})

  const webBuild = yield* Command.Build('web-build', {
    command: 'pnpm --filter web build',
    cwd: '.',
    outdir: 'apps/web/.output',
    env: {
      SKEW_PROTECTION_KV_NAMESPACE_ID: SkewProtection.namespaceId,
      // Cloudflare Workers use routeRules ISR + KV bindings — not Vercel Redis.
      REDIS_URL: '',
      CMS_BASE_URL: cmsBaseUrl,
      NUXT_PUBLIC_CMS_BASE_URL: cmsPublicUrl,
      NUXT_OG_IMAGE_SECRET: ogImageSecret,
      NUXT_PUBLIC_SITE_URL: siteUrl,
    },
    memo: {
      include: ['apps/web/**', 'pnpm-lock.yaml', 'pnpm-workspace.yaml'],
      exclude: ['apps/web/.nuxt', 'apps/web/.cache'],
    },
  })

  const Web = yield* Cloudflare.Worker('Web', {
    bundle: false,
    main: 'apps/web/.output/server/index.mjs',
    domain: webDomain,
    // Workers Cache intentionally OFF — see ADR-006 (static assets stay free).
    env: {
      Cache: input.Cache,
      AI_READY_DB: input.AiReadyDB,
      SKEW_PROTECTION: SkewProtection,
      CMS_BASE_URL: cmsBaseUrl,
      NUXT_PUBLIC_CMS_BASE_URL: cmsPublicUrl,
      NUXT_PUBLIC_SITE_URL: siteUrl,
      NUXT_OG_IMAGE_SECRET: ogImageSecret,
      STRAPI_URL: Config.string('STRAPI_URL').pipe(Config.withDefault('')),
    },
    compatibility: WEB_NODE_COMPAT,
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
