// https://nuxt.com/docs/api/configuration/nuxt-config
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
    session: {
      maxAge: 60 * 60 * 8,
    },
    strapiUrl: process.env.STRAPI_URL || 'https://admin.journalducuistot.fr',
    strapiApiToken: process.env.STRAPI_API_TOKEN || '',
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
      },
    },
    experimental: {
      tasks: true,
      asyncContext: true,
    },
    scheduledTasks: {
      '*/5 * * * *': 'publish-scheduled'
    }
  },

  compatibilityDate: '2025-01-15',
})
