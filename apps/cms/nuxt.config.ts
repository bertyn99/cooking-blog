// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devServer: {
    port: 3001
  },

  modules: [
    '@nuxt/ui',
    '@vueuse/nuxt',
    'evlog'
  ],

  css: ['~/assets/css/main.css'],

  devtools: {
    enabled: true
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
