// https://nuxt.com/docs/api/configuration/nuxt-config
import { fileURLToPath } from 'node:url'
import listRedirects from './app/utils/redirect'
import tailwindcss from '@tailwindcss/vite'
import { resolveSiteIdentity, toSchemaOrgIdentity, SITE_AUTHOR_NAME } from './shared/site-identity'

const webRoot = fileURLToPath(new URL('.', import.meta.url))

const skewProtectionKvNamespaceId =
  process.env.SKEW_PROTECTION_KV_NAMESPACE_ID || 'skew-protection-local'
/** KV asset bundling only on deploy builds (real namespace + token), not local defaults. */
const skewProtectionBundleAssets = Boolean(
  process.env.CLOUDFLARE_API_TOKEN &&
  process.env.SKEW_PROTECTION_KV_NAMESPACE_ID &&
  skewProtectionKvNamespaceId !== 'skew-protection-local'
)

const siteUrl = process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000'
const siteOrigin = siteUrl.replace(/\/$/, '')
const siteName = process.env.NUXT_SITE_NAME || 'Journal du cuistot'
const siteDescription =
  process.env.NUXT_SITE_DESCRIPTION ||
  "Bienvenue sur le journal du cuistot, un blog de recettes de cuisine d'un globe-trotter"
const siteIdentity = resolveSiteIdentity({ siteOrigin, siteName })
const siteEnv =
  process.env.NUXT_SITE_ENV ||
  (process.env.NODE_ENV === 'production' ? 'production' : 'development')

function resolveSiteIndexable(): boolean | undefined {
  if (process.env.NUXT_SITE_INDEXABLE === 'true') {
    return true
  }
  if (process.env.NUXT_SITE_INDEXABLE === 'false') {
    return false
  }
  return undefined
}

export default defineNuxtConfig({
  compatibilityDate: '2026-07-20',

  future: {
    compatibilityVersion: 5,
  },

  app: {
    head: {
      titleTemplate: '%s — %siteName',
      htmlAttrs: {
        lang: 'fr', // Set the default language here
      },
      link: [{ rel: 'icon', type: 'image/webp', href: '/img/logo.webp' }],
      /* script: [
        {
          src: "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js",
          async: true,
          crossorigin: "anonymous",
          type: "text/partytown",
        },
      ], */
    },
  },

  modules: [
    '@nuxtjs/seo',
    'nuxt-ai-ready',
    'nuxt-skew-protection',
    '@nuxt/fonts',
    '@nuxt/icon',
    '@nuxtjs/partytown',
    '@nuxt/image',
    '@vueuse/nuxt',
    /*    [
       "@nuxtjs/google-fonts",
       {
         families: {
           Merriweather: true,
           "Merriweather+Sans": true,
           Catamaran: true,
           download: true,
           inject: true,
         },
       }
       ], */
    'nuxt-umami',
  ],

  css: ['~/assets/css/index.css'],

  vite: {
    plugins: [tailwindcss()],
  },

  routeRules: {
    '/': { isr: 60 * 15 },
    '/blog/**': { isr: 60 * 25 },
    '/images/**': {
      isr: 60 * 60 * 24 * 30,
      headers: {
        'Cache-Control': 'public, max-age=31536000, stale-while-revalidate=604800',
      },
    },
    '/sitemap.xml': { isr: 60 * 60 * 24 },
    '/rss.xml': { isr: 60 * 60 * 24 * 3 },
    '/preview': { robots: false },
    '/preview/**': { robots: false },
    ...listRedirects,

    '/*/**': {
      ogImage: {
        component: 'Cooking',
        props: {
          title: 'Journal du cuistot',
        },
      },
    },
  },

  nitro: {
    experimental: {
      tasks: true,
    },
    ...(process.env.REDIS_URL
      ? {
          storage: {
            cache: { driver: 'redis', url: process.env.REDIS_URL },
          },
        }
      : {}),
  },

  components: [
    {
      path: '~/components',
      ignore: ['prose/**'],
    },
    {
      global: true,
      path: '~/components/prose',
      /*  pathPrefix: false, */
    },
  ],

  site: {
    url: siteUrl,
    name: siteName,
    description: siteDescription,
    defaultLocale: 'fr',
    trailingSlash: false,
    env: siteEnv,
    ...(resolveSiteIndexable() !== undefined
      ? { indexable: resolveSiteIndexable() }
      : {}),
  },

  schemaOrg: {
    identity: toSchemaOrgIdentity(siteIdentity, siteDescription),
  },

  seo: {
    redirectToCanonicalSiteUrl: siteEnv === 'production',
    meta: {
      description: siteDescription,
      author: SITE_AUTHOR_NAME,
      ogLocale: 'fr_FR',
      ogType: 'website',
      twitterCard: 'summary_large_image',
    },
  },

  aiReady: {
    database: {
      type: 'd1',
      bindingName: 'AI_READY_DB',
    },
    contentSignal: {
      aiTrain: true,
      search: true,
      aiInput: true,
    },
    llmsTxt: {
      sections: [
        {
          title: 'Contenu',
          links: [
            {
              title: 'Blog',
              href: '/blog',
              description: 'Articles et actualités cuisine',
            },
            {
              title: 'Recettes',
              href: '/recette',
              description: 'Catalogue des recettes',
            },
          ],
        },
        {
          title: 'Flux et index',
          links: [
            {
              title: 'RSS',
              href: '/rss.xml',
              description: 'Flux RSS du site',
            },
            {
              title: 'Index IA',
              href: '/api/sitemap-ia',
              description: 'Routes groupées pour agents',
            },
            {
              title: 'Plan du site',
              href: '/sitemap.xml',
              description: 'Index XML des sitemaps',
            },
          ],
        },
      ],
      notes: 'Journal du cuistot — recettes et articles de cuisine en français (fr-FR).',
    },
  },

  skewProtection: {
    updateStrategy: 'polling',
    bundleAssets: skewProtectionBundleAssets,
    storage: {
      driver: 'cloudflare-kv-binding',
      binding: 'SKEW_PROTECTION',
      namespaceId: skewProtectionKvNamespaceId,
    },
  },

  experimental: {
    checkOutdatedBuildInterval: 5 * 60 * 1000,
  },

  image: {
    providers: {
      localImageSharp: {
        provider: '~/providers/localImageSharp',
        options: {
          baseURL: `/images/`,
        },
      },
    },
  },

  umami: {
    id: process.env.NUXT_UMAMI_ID,
    host: process.env.NUXT_UMAMI_HOST,
    autoTrack: true,
    ignoreLocalhost: true,
    enabled: true,
    // Core Web Vitals (LCP, FCP, CLS, INP, TTFB) — requires Umami v3.1.0+
    performance: true,
  },

  runtimeConfig: {
    site: {
      name: siteName,
      description: siteDescription,
      url: siteUrl,
      identity: siteIdentity,
    },
    public: {
      language: 'fr-FR', // prefer more explicit language codes like `en-AU` over `en`
      cmsBaseUrl: process.env.NUXT_PUBLIC_CMS_BASE_URL || 'http://localhost:3001',
      apiBase: process.env.NUXT_PUBLIC_CMS_BASE_URL || 'http://localhost:3001',
    },
  },

  sitemap: {
    exclude: ['/preview', '/preview/**', '/api/**', '/images/**'],
    sitemaps: {
      pages: {
        includeAppSources: true,
        sitemapName: 'sitemap-pages.xml',
        sources: ['/api/__sitemap__/urls'],
        exclude: ['/blog', '/blog/**', '/recette', '/recette/**'],
        defaults: {
          changefreq: 'daily' as const,
          priority: 0.8,
        },
      },
      blog: {
        includeAppSources: true,
        include: ['/blog', '/blog/**'],
        sitemapName: 'sitemap-blog.xml',
        sources: ['/api/__sitemap__/urls'],
        defaults: {
          changefreq: 'daily' as const,
          priority: 0.8,
        },
      },
      recipes: {
        includeAppSources: true,
        include: ['/recette', '/recette/**'],
        sitemapName: 'sitemap-recipes.xml',
        sources: ['/api/__sitemap__/urls'],
        defaults: {
          changefreq: 'daily' as const,
          priority: 0.8,
        },
      },
    },
  },

  /*  devServer: {
    https: {
      key: "localhost-key.pem",
      cert: "localhost.pem",
    },
  }, */

  devtools: {
    enabled: true,
  },
})
