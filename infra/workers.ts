import * as Alchemy from 'alchemy'
import * as Cloudflare from 'alchemy/Cloudflare'
import * as Output from 'alchemy/Output'
import { fileURLToPath } from 'node:url'
import { Stage } from 'alchemy/Stage'
import * as Config from 'effect/Config'
import * as Effect from 'effect/Effect'
import { CMS_AI_GATEWAY_ID } from '../apps/cms/shared/workers-ai-model.ts'

/** Production custom domains (`stage === prod` only). Set via env — not committed. */
const CMS_DEV_PORT = 3001
const WEB_DEV_PORT = 3000
const CMS_ROOT_DIR = fileURLToPath(new URL('../apps/cms/', import.meta.url))
const WEB_ROOT_DIR = fileURLToPath(new URL('../apps/web/', import.meta.url))

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

const NUXT_MEMO = {
  include: [
    'app/**',
    'server/**',
    'shared/**',
    'public/**',
    'exports.cloudflare.ts',
    'nuxt.config.ts',
    'app.config.ts',
    'package.json',
  ],
  exclude: ['.data/**', 'coverage/**', '.nuxt/**', '.output/**', '.cache/**'],
}

export const workers = Effect.fn(function* (input: {
  DB: Cloudflare.D1.Database
  AiReadyDB: Cloudflare.D1.Database
  Media: Cloudflare.R2.Bucket
  Cache: Cloudflare.KV.Namespace
}) {
  const stage = yield* Stage
  const isProd = stage === 'prod'
  const isAlchemyDev = yield* Alchemy.ALCHEMY_DEV
  const prodWebHost = yield* Config.string('PROD_WEB_HOST').pipe(Config.withDefault(''))
  const prodCmsHost = yield* Config.string('PROD_CMS_HOST').pipe(Config.withDefault(''))
  const normalizeHost = (value: string) =>
    value.replace(/^https?:\/\//, '').replace(/\/$/, '')
  const prodCmsOrigin = prodCmsHost ? `https://${normalizeHost(prodCmsHost)}` : ''
  const cmsDomain = isProd && prodCmsHost ? normalizeHost(prodCmsHost) : undefined
  const webDomain = isProd && prodWebHost ? normalizeHost(prodWebHost) : undefined

  // Provision AI Gateway (dashboard logs, caching, rate limits).
  // Nuxt CMS uses Workers AI binding + `CMS_AI_GATEWAY_ID` in `workers-ai-provider` (not Effect `QueryGateway`).
  // @see https://alchemy.run/cloudflare/ai/ai-gateway/
  // @see https://alchemy.run/cloudflare/ai/workers-ai
  yield* Cloudflare.AI.Gateway('CmsAi', {
    id: CMS_AI_GATEWAY_ID,
    cacheTtl: 60,
    collectLogs: true,
  })

  const ContentGeneration = Cloudflare.Workflow<{ runId: string }>('ContentGeneration', {
    className: 'ContentGenerationWorkflow',
  })

  // Nuxt runtimeConfig only picks up NUXT_* env at runtime on Workers.
  const strapiUrl = Config.string('STRAPI_URL').pipe(Config.withDefault(''))
  const strapiApiToken = Config.string('STRAPI_API_TOKEN').pipe(Config.withDefault(''))

  // Website.Nuxt builds via @distilled.cloud/nuxt (cloudflare_module) and
  // runs Nuxt's own dev server under `alchemy dev` with bindings on
  // event.context.cloudflare — wrangler-free.
  // @see https://alchemy.run/cloudflare/frontend/nuxt/
  // Workflow class stays on nitro's exports.cloudflare.ts seam (no custom main).
  // Workflows are not servable in Website.Nuxt local dev yet — omit the binding
  // so the platform proxy can start; CMS uses processRunOnce fallback (see service.ts).
  const Cms = yield* Cloudflare.Website.Nuxt('Cms', {
    rootDir: CMS_ROOT_DIR,
    domain: cmsDomain,
    cache: CMS_WORKERS_CACHE,
    // Keep the Alchemy URL stable for local CMS tooling.
    dev: {
      port: CMS_DEV_PORT,
      strictPort: true,
    },
    // @distilled.cloud/nuxt 0.17.1 normally asks Nuxt for port 0. The
    // project patch forwards this override so Nuxt itself listens on 3001.
    nuxt: {
      devServer: {
        port: CMS_DEV_PORT,
      },
    },
    env: {
      DB: input.DB,
      Media: input.Media,
      Cache: input.Cache,
      AI: Cloudflare.Workers.AI(),
      CMS_AI_GATEWAY_ID: Config.string('CMS_AI_GATEWAY_ID').pipe(
        Config.withDefault(CMS_AI_GATEWAY_ID)
      ),
      ...(isAlchemyDev ? {} : { CONTENT_GENERATION: ContentGeneration }),
      NUXT_SESSION_PASSWORD: Config.string('NUXT_SESSION_PASSWORD'),
      NUXT_OG_IMAGE_SECRET: Config.string('NUXT_OG_IMAGE_SECRET').pipe(Config.withDefault('')),
      STRAPI_URL: strapiUrl,
      NUXT_STRAPI_URL: strapiUrl,
      STRAPI_API_TOKEN: strapiApiToken,
      NUXT_STRAPI_API_TOKEN: strapiApiToken,
    },
    crons: [PUBLISH_CRON],
    compatibility: NODE_COMPAT,
    memo: NUXT_MEMO,
  })

  // Prod → custom CMS host; preview / local → Cms.url (workers.dev or alchemy.dev localhost).
  const cmsOriginOverride = yield* Config.string('CMS_BASE_URL').pipe(Config.option)
  const cmsPublicOverride = yield* Config.string('NUXT_PUBLIC_CMS_BASE_URL').pipe(Config.option)
  const cmsWorkerOrigin = Output.map(Cms.url, (url) => url ?? 'http://localhost:3001')
  const defaultCmsOrigin = isProd ? prodCmsOrigin : cmsWorkerOrigin
  const cmsBaseUrl = cmsOriginOverride._tag === 'Some' ? cmsOriginOverride.value : defaultCmsOrigin
  const cmsPublicUrl =
    cmsPublicOverride._tag === 'Some' ? cmsPublicOverride.value : defaultCmsOrigin
  const siteUrlFromEnv = yield* Config.string('NUXT_PUBLIC_SITE_URL').pipe(
    Config.withDefault('http://localhost:3000'),
  )
  const siteUrl =
    isProd && prodWebHost
      ? `https://${normalizeHost(prodWebHost)}`
      : siteUrlFromEnv
  const ogImageSecret = Config.string('NUXT_OG_IMAGE_SECRET').pipe(Config.withDefault(''))
  const umamiId = isProd
    ? yield* Config.string('NUXT_UMAMI_ID').pipe(Config.withDefault(''))
    : ''
  const umamiHost = isProd
    ? yield* Config.string('NUXT_UMAMI_HOST').pipe(Config.withDefault(''))
    : ''

  const SkewProtection = yield* Cloudflare.KV.Namespace('WebSkewProtection', {})

  // Deploy-time Nuxt overrides (merge over apps/web/nuxt.config.ts).
  // Skew `bundleAssets` with cloudflare-kv-binding shells out to `wrangler kv put`
  // once per `_nuxt` asset during Nuxt's nitro `compiled` hook — hangs CI for
  // tens of minutes. Alchemy memo skips rebuilds via the `input` hash (project
  // tree + `nuxt` options), not post-build asset bytes — see Website.Nuxt /
  // @distilled.cloud/nuxt. Off in CI; local `pnpm alchemy deploy` can enable it.
  const skewBundleAssets =
    Boolean(process.env.CLOUDFLARE_API_TOKEN) && process.env.CI !== 'true'
  // Former Command.Build forced REDIS_URL='' so nuxt.config does not embed
  // Vercel Redis into the Workers bundle (host `.env` still has REDIS_URL).
  process.env.REDIS_URL = ''

  const Web = yield* Cloudflare.Website.Nuxt('Web', {
    rootDir: WEB_ROOT_DIR,
    domain: webDomain,
    // Workers Cache intentionally OFF — see ADR-006 (static assets stay free).
    dev: {
      port: WEB_DEV_PORT,
      strictPort: true,
    },
    env: {
      Cache: input.Cache,
      AI_READY_DB: input.AiReadyDB,
      SKEW_PROTECTION: SkewProtection,
      CMS_BASE_URL: cmsBaseUrl,
      NUXT_PUBLIC_CMS_BASE_URL: cmsPublicUrl,
      NUXT_PUBLIC_SITE_URL: siteUrl,
      NUXT_OG_IMAGE_SECRET: ogImageSecret,
      STRAPI_URL: Config.string('STRAPI_URL').pipe(Config.withDefault('')),
      NUXT_UMAMI_ID: umamiId,
      ...(isProd && umamiHost ? { NUXT_UMAMI_HOST: umamiHost } : {}),
      ...(isProd ? {} : { NUXT_SITE_INDEXABLE: 'false' }),
    },
    compatibility: WEB_NODE_COMPAT,
    memo: NUXT_MEMO,
    nuxt: {
      devServer: {
        port: WEB_DEV_PORT,
      },
      site: {
        url: siteUrl,
        ...(isProd ? {} : { indexable: false }),
      },
      // CMS URL / apiBase: prefer Worker `env` (`NUXT_PUBLIC_CMS_BASE_URL`,
      // `CMS_BASE_URL`) over `nuxt.runtimeConfig`. Putting Outputs inside
      // `source.options.nuxt` can leave Alchemy's converge loop forever-dirty
      // (`havePropsChanged` → rebuild → OOM on GHA).
      umami: {
        id: umamiId,
        ...(isProd ? { host: umamiHost } : {}),
      },
      skewProtection: {
        bundleAssets: skewBundleAssets,
        // namespaceId is only needed for build-time KV asset uploads.
        ...(skewBundleAssets
          ? {
              storage: {
                namespaceId: SkewProtection.namespaceId,
              },
            }
          : {}),
      },
    },
  })

  return { Cms, Web }
})
