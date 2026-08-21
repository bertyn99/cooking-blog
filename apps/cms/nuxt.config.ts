// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devServer: {
    port: 3001,
  },

  modules: ['nuxt-auth-utils', 'nuxt-authorization', '@nuxt/ui', '@vueuse/nuxt', 'evlog/nuxt', '@nuxtjs/mcp-toolkit'],

  mcp: {
    name: 'Journal du Cuistot CMS',
    description: 'Draft-only articles, recipes, and pages for Journal du Cuistot.',
    instructions: [
      'All writes are drafts. Never publish. 403 means the row is live — stop.',
      'List and get may return published rows (writable=false). Do not update those.',
      'List categories before setting categoryId. Locale fr. Comark markdown.',
      'Use start-generation-run for notes-to-new-draft; CRUD for precise edits on drafts.',
    ].join(' '),
    route: '/mcp',
    sessions: false,
    security: {
      allowedOrigins: '*',
    },
  },

  runtimeConfig: {
    public: {
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000',
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
  },

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
