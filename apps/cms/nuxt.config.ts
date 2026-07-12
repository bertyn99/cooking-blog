// https://nuxt.com/docs/api/configuration/nuxt-config
import { resolve } from 'node:path'

export default defineNuxtConfig({
  devServer: {
    port: 3001
  },

  modules: [
    '@nuxthub/core',
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

  hooks: {
    ready(nuxt) {
      const dbClient = resolve(nuxt.options.rootDir, 'server/db/client')
      nuxt.options.alias['hub:db'] = dbClient
      nuxt.options.alias['@nuxthub/db'] = dbClient
    },
  },
})
