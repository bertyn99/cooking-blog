// https://nuxt.com/docs/api/configuration/nuxt-config
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

function writeDevWranglerConfig(nitroConfig: {
  dev?: boolean
  rootDir?: string
  compatibilityDate?: { cloudflare?: string, default?: string }
  cloudflare?: { deployConfig?: boolean, wrangler?: Record<string, unknown> }
}) {
  if (!nitroConfig.dev || !nitroConfig.cloudflare?.deployConfig || !nitroConfig.rootDir) {
    return
  }
  const wrangler = { ...(nitroConfig.cloudflare.wrangler ?? {}) }
  // Workflows need a deployed `script_name`; omit them in local getPlatformProxy
  // to avoid Wrangler’s noisy “not available in local development” warning.
  delete wrangler.workflows
  const devWrangler = {
    name: 'jdc-cms-local',
    compatibility_date:
      nitroConfig.compatibilityDate?.cloudflare
      ?? nitroConfig.compatibilityDate?.default
      ?? '2026-05-27',
    ...wrangler,
  }
  const dir = join(nitroConfig.rootDir, '.wrangler/dev')
  const path = join(dir, 'wrangler.json')
  mkdirSync(dir, { recursive: true })
  writeFileSync(path, JSON.stringify(devWrangler, null, 2))
}

export default defineNuxtConfig({
  devServer: {
    port: 3001
  },

  modules: [
    'nuxt-auth-utils',
    'nuxt-authorization',
    '@nuxt/ui',
    '@vueuse/nuxt',
    'evlog',
  ],

  runtimeConfig: {
    public: {
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'https://journalducuistot.fr',
    },
    session: {
      maxAge: 60 * 60 * 8,
    },
    // Overridden at runtime by NUXT_STRAPI_URL on Workers (plain STRAPI_URL alone is ignored by Nuxt).
    strapiUrl: process.env.NUXT_STRAPI_URL || process.env.STRAPI_URL || '',
    strapiApiToken: process.env.NUXT_STRAPI_API_TOKEN || process.env.STRAPI_API_TOKEN || '',
    /** Optional origin for Strapi `/uploads` files (e.g. public site CDN). */
    strapiUploadsOrigin: process.env.NUXT_STRAPI_UPLOADS_ORIGIN || process.env.STRAPI_UPLOADS_ORIGIN || '',
    /** Nuxt SEO Pro MCP (in-app content agent keyword tools). */
    nuxtSeoProMcpUrl: process.env.NUXT_SEO_PRO_MCP_URL || 'https://nuxtseo.com/mcp/pro',
    nuxtSeoProApiKey: process.env.NUXT_SEO_PRO_API_KEY || '',
    /** Cloudflare AI Gateway id for Workers AI (`workers-ai-provider` gateway option). */
    cmsAiGatewayId: process.env.CMS_AI_GATEWAY_ID || 'jdc-cms-ai',
  },

  css: ['~/assets/css/main.css'],

  devtools: {
    enabled: true
  },

  vite: {
    optimizeDeps: {
      include: [
        '@vue/devtools-core',
        '@vue/devtools-kit',
        '@nuxt/ui > prosemirror-state',
        '@nuxt/ui > prosemirror-transform',
        '@nuxt/ui > prosemirror-model',
        '@nuxt/ui > prosemirror-view',
        '@nuxt/ui > prosemirror-gapcursor',
      ],
    },
  },

  future: {
    compatibilityVersion: 5
  },

  nitro: {
    preset: 'cloudflare_module',
    compatibilityDate: '2026-05-27',
    cloudflare: {
      deployConfig: true,
      dev: {
        // Generated on dev start from `cloudflare.wrangler` below (bindings-only for getPlatformProxy).
        configPath: '.wrangler/dev/wrangler.json',
      },
      wrangler: {
        compatibility_flags: ['nodejs_compat'],
        d1_databases: [
          {
            binding: 'DB',
            database_name: 'cms-local',
            database_id: 'cms-local',
          },
        ],
        r2_buckets: [
          {
            binding: 'Media',
            bucket_name: 'cms-media-local',
          },
        ],
        kv_namespaces: [
          {
            binding: 'Cache',
            id: 'cms-cache-local',
          },
        ],
        ai: {
          binding: 'AI',
          remote: true,
        },
        workflows: [
          {
            name: 'content-generation',
            binding: 'CONTENT_GENERATION',
            class_name: 'ContentGenerationWorkflow',
          },
        ],
      },
    },
    experimental: {
      tasks: true,
      asyncContext: true,
    },
    ...(process.env.NODE_ENV === 'production'
      ? {
        scheduledTasks: {
          '*/5 * * * *': 'publish-scheduled',
          // Fallback poller if Workflow create failed / local legacy runs.
          '2-57/5 * * * *': 'generation-process',
        },
      }
      : {}),
    externals: {
      inline: [
        '@jsquash/jpeg',
        '@jsquash/png',
        '@jsquash/webp',
        '@jsquash/resize',
      ],
    },
  },

  compatibilityDate: '2025-01-15',

  routeRules: {
    '/api/**': {
      headers: {
        'Cache-Control': 'private, no-store, must-revalidate',
      },
    },
  },

  evlog: {
    env: {
      service: 'journalducuistot-cms',
    },
    include: ['/api/**'],
  },

  hooks: {
    'nitro:config'(nitroConfig) {
      writeDevWranglerConfig(nitroConfig)
    },
  },
})
