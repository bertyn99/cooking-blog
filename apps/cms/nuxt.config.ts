// https://nuxt.com/docs/api/configuration/nuxt-config
import { fileURLToPath } from 'node:url'

/**
 * Map `cloudflare:*` runtime module imports onto local shims.
 *
 * workerd provides these modules natively and the deployed worker runs with
 * `nodejs_compat`, but nitro's base-worker preset forces `noExternals`, and
 * its no-externals resolver throws on `cloudflare:*` when the import comes
 * from a node_modules dependency (`agents`, behind @nuxtjs/mcp-toolkit's
 * Cloudflare transport). Redirecting to real shim files (which re-export the
 * runtime modules through a computed dynamic specifier — see
 * `server/shims/`) keeps nitro's single-script bundling intact.
 */
const cloudflareRuntimeModulesPlugin = {
  name: 'jdc-cms:cloudflare-runtime-modules',
  resolveId(id: string) {
    if (id === 'cloudflare:workers' || id === 'cloudflare:workflows' || id === 'cloudflare:email') {
      return { id: fileURLToPath(new URL(`./server/shims/cloudflare-${id.slice('cloudflare:'.length)}.mjs`, import.meta.url)), external: false }
    }
    return null
  },
}

export default defineNuxtConfig({
  modules: ['@journalducuistot/shared', 'nuxt-auth-utils', 'nuxt-authorization', '@nuxt/ui', '@vueuse/nuxt', 'evlog/nuxt', '@nuxtjs/mcp-toolkit'],
  jdcContent: {
    surfaces: ['client', 'editor', 'simple'],
  },

  mcp: {
    name: 'Journal du Cuistot CMS',
    description: 'Articles, recipes, and pages for Journal du Cuistot. Agents never publish.',
    instructions: [
      'Never publish, unpublish, or schedule.',
      'Articles and pages: update in any status; writable is always true. Recipes: draft-only (403 if live).',
      'After create/update, give the human previewUrl. Never publish, unpublish, or schedule.',
      'List categories before setting categoryId. Locale fr. Comark markdown.',
      'Use start-generation-run for notes-to-new-draft; CRUD for precise edits on drafts.',
    ].join(' '),
    route: '/mcp',
    // Stateful transport (MCP-Session-Id + SSE) with per-session state via
    // useMcpSession(). Persisted through the unstorage driver below.
    sessions: { enabled: true },
    security: {
      allowedOrigins: '*',
    },
  },

  runtimeConfig: {
    public: {
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000',
      /** Public admin origin (MCP, API). Falls back to request origin in the UI when unset. */
      cmsBaseUrl:
        process.env.NUXT_PUBLIC_CMS_BASE_URL
        || process.env.CMS_BASE_URL
        || '',
    },
    session: {
      maxAge: 60 * 60 * 8,
    },
    // Overridden at runtime by NUXT_STRAPI_URL on Workers (plain STRAPI_URL alone is ignored by Nuxt).
    strapiUrl: process.env.NUXT_STRAPI_URL || process.env.STRAPI_URL || '',
    strapiApiToken: process.env.NUXT_STRAPI_API_TOKEN || process.env.STRAPI_API_TOKEN || '',
    /** Optional origin for Strapi `/uploads` files (e.g. public site CDN). */
    strapiUploadsOrigin:
      process.env.NUXT_STRAPI_UPLOADS_ORIGIN || process.env.STRAPI_UPLOADS_ORIGIN || '',
    /** Nuxt SEO Pro MCP (in-app content agent keyword tools). */
    nuxtSeoProMcpUrl: process.env.NUXT_SEO_PRO_MCP_URL || 'https://nuxtseo.com/mcp/pro',
    nuxtSeoProApiKey: process.env.NUXT_SEO_PRO_API_KEY || '',
    /** Cloudflare AI Gateway id for Workers AI (`workers-ai-provider` gateway option). */
    cmsAiGatewayId: process.env.CMS_AI_GATEWAY_ID || 'jdc-cms-ai',
    /** Pexels API key for Stock tab (server-only). */
    pexelsApiKey: process.env.PEXELS_API_KEY || '',
    /** Kill switch for `/mcp` (`0` / `false` / `off` = empty catalog). Default on. */
    cmsMcpEnabled: process.env.CMS_MCP_ENABLED || '1',
    /** Shared with apps/web so `/preview` can load drafts. Empty in production unless set. */
    cmsPreviewToken: process.env.CMS_PREVIEW_TOKEN || (process.env.NODE_ENV === 'production' ? '' : 'local-preview'),
  },

  css: ['~/assets/css/main.css'],

  devtools: {
    enabled: true,
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
    compatibilityVersion: 5,
  },

  nitro: {
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
      inline: ['@jsquash/jpeg', '@jsquash/png', '@jsquash/webp', '@jsquash/resize'],
    },
    // MCP sessions persist to KV through unstorage — see
    // https://mcp-toolkit.nuxt.dev/advanced/sessions#custom-storage-driver.
    // `Cache` is the KV namespace already bound by Alchemy (infra/workers.ts);
    // the base prefix keeps session keys away from other Cache users.
    // En dev local (pas de bindings Cloudflare), driver mémoire : les sessions
    // MCP sont éphémères, ce qui suffit — et évite le 500 « Invalid binding
    // Cache: undefined » sur chaque requête avec mcp-session-id.
    storage: process.env.NODE_ENV === 'production'
      ? {
          'mcp:sessions': {
            driver: 'cloudflare-kv-binding',
            binding: 'Cache',
            base: 'mcp:sessions',
          },
          'mcp:sessions-meta': {
            driver: 'cloudflare-kv-binding',
            binding: 'Cache',
            base: 'mcp:sessions-meta',
          },
        }
      : {
          'mcp:sessions': { driver: 'memory' },
          'mcp:sessions-meta': { driver: 'memory' },
        },
    rollupConfig: {
      plugins: [cloudflareRuntimeModulesPlugin],
    },
  },
  // ⚠️ Build date — keep in sync with runtime needs only. Bumping past
  // 2025-01-15 changes Nitro's cloudflare_module stitching and DROPS the
  // exports.cloudflare.ts additional exports (ContentGenerationWorkflow) —
  // ScriptStartupError at deploy (seen 2026-10-08). The RUNTIME date lives in
  // infra/workers.ts NODE_COMPAT.
  compatibilityDate: '2025-01-15',

  routeRules: {
    '/api/**': {
      headers: {
        'Cache-Control': 'private, no-store, must-revalidate',
      },
    },
    '/mcp': {
      headers: {
        'Cache-Control': 'private, no-store, must-revalidate',
      },
    },
  },

  evlog: {
    env: {
      service: 'journalducuistot-cms',
    },
    include: ['/api/**', '/mcp'],
    exclude: ['/api/_evlog/ingest'],
    redact: {
      paths: [
        'user.email',
        'headers.authorization',
        'headers.cookie',
        'request.headers.authorization',
        'request.headers.cookie',
      ],
    },
    strip: ['debug'],
    sourceLocation: 'dev',
    transport: {
      enabled: true,
      endpoint: '/api/_evlog/ingest',
      credentials: 'include',
    },
  },
})
