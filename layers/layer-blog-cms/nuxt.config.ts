// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxthub/core',
    '@nuxt/eslint',
    'evlog'
  ],

  devtools: {
    enabled: true
  },

  future: {
    compatibilityVersion: 5
  },

  hub: {
    db: 'sqlite',
    blob: true,
    kv: true,
    cache: true
  },

  nitro: {
    experimental: {
      tasks: true
    },
    scheduledTasks: {
      '*/5 * * * *': 'publish-scheduled'
    }
  },

  compatibilityDate: '2025-01-15',

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  }
})
