// https://nuxt.com/docs/api/configuration/nuxt-config
import listRedirects from "./app/utils/redirect";

export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',

  extends: [
    'layers/layer-blog-cms'
  ],

  future: {
    compatibilityVersion: 5
  },

  app: {
    head: {
      titleTemplate: '%s — %siteName',
      htmlAttrs: {
        lang: 'fr' // Set the default language here
      },
      link: [{ rel: "icon", type: "image/webp", href: "/img/logo.webp" }],
      /* script: [
        {
          src: "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5406721051491594",
          async: true,
          crossorigin: "anonymous",
          type: "text/partytown",
        },
      ], */
    },
  },

  modules: [
    "@nuxtjs/tailwindcss",
    "@nuxt/icon",
    "@nuxtjs/partytown",
    "@nuxt/image",
    '@nuxtjs/seo',
    "@vueuse/nuxt",
    '@nuxtjs/mdc',
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
    "nuxt-umami"
  ],

  routeRules: {
    "/": { isr: 60 * 15 },
    "/blog/**": { isr: 60 * 25 },
    "/images/**": { isr: 60 * 60 * 24 * 5 },
    "/sitemap.xml": { isr: 60 * 60 * 24 },
    "/rss.xml": { isr: 60 * 60 * 24 * 3 },
    ...listRedirects,

    "/*/**": {
      ogImage: {
        component: "Cooking",
        props: {
          title: "Journal du cuistot",
        },
      },

    },
  },

  nitro: {
    experimental: {
      tasks: true
    },
    storage: {
      cache: { driver: "redis", url: process.env.REDIS_URL },
    },
  },

  mdc: {
    components: {
      prose: true
    }
  },
  components: [{
    path: '~/components',
    exclude: ['prose/**'],
  }, {
    global: true,
    path: '~/components/prose',
    /*  pathPrefix: false, */
  }],

  site: {
    url: process.env.NUXT_PUBLIC_SITE_URL || "https://journalducuistot.fr",
    name: "Journal du cuistot",
  },

  seo: {
    meta: {
      description: "Bienvenu sur le journal du cuistot, un blog de recettes de cuisine d'un globe trotter",
      ogLocale: 'fr_FR',
      ogType: 'website',
      ogUrl: "https://journalducuistot.fr",
      ogTitle: 'JournalduCuistot',
    }

  },

  image: {
    providers: {
      localImageSharp: {
        provider: "~/providers/localImageSharp",
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

  },

  tailwindcss: {
    cssPath: "~/assets/css/index.css",
    configPath: "~/tailwind.config.ts",
  },

  runtimeConfig: {
    public: {
      language: "fr-FR", // prefer more explicit language codes like `en-AU` over `en`
    },
  },

  sitemap: {

    sitemaps: {
      pages: {
        includeGlobalSources: true,
        includeAppSources: true,
        path: '/sitemap-pages.xml',
        changefreq: 'daily',
        priority: 0.8,
        sources: [
          '/api/__sitemap__/urls',
        ],
        exclude: ['/blog/**', '/recette/**'],
      },
      blog: {
        includeGlobalSources: true,
        includeAppSources: true,
        path: '/sitemap-blog.xml',
        changefreq: 'daily',
        priority: 0.8,
        exclude: ['/recette/**', '/'],
        sources: [
          '/api/__sitemap__/urls',
        ],
      },
      recipes: {
        includeGlobalSources: true,
        includeAppSources: true,
        path: '/sitemap-recipes.xml',
        changefreq: 'daily',
        priority: 0.8,
        exclude: ['/blog/**', '/'],
        sources: [
          '/api/__sitemap__/urls',
        ],
      },
    }
  },


  /*  devServer: {
    https: {
      key: "localhost-key.pem",
      cert: "localhost.pem",
    },
  }, */

  devtools: {
    enabled: true
  }
});
