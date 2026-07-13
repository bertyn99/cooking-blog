// https://nuxt.com/docs/api/configuration/nuxt-config
import listRedirects from "./app/utils/redirect";
import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',

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

  css: ['~/assets/css/index.css'],

  vite: {
    plugins: [tailwindcss()],
  },

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

  ogImage: {
    compatibility: {
      runtime: {
        chromium: false,
        'css-inline': false,
        resvg: 'wasm-fs',
        satori: 'node',
        sharp: false,
      },
    },
  },

  nitro: {
    preset: 'cloudflare_module',
    compatibilityDate: '2026-05-27',
    cloudflare: {
      deployConfig: true,
      nodeCompat: true,
    },
    unenv: {
      alias: {
        'process/': 'node:process',
        'string_decoder/': 'node:string_decoder',
      },
    },
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
    ignore: ['prose/**'],
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

  runtimeConfig: {
    public: {
      language: "fr-FR", // prefer more explicit language codes like `en-AU` over `en`
      cmsBaseUrl: process.env.NUXT_PUBLIC_CMS_BASE_URL || 'http://localhost:3001',
      apiBase: process.env.NUXT_PUBLIC_CMS_BASE_URL || 'http://localhost:3001',
    },
  },

  sitemap: {

    sitemaps: {
      pages: {
        includeAppSources: true,
        sitemapName: 'sitemap-pages.xml',
        defaults: {
          changefreq: 'daily' as const,
          priority: 0.8,
        },
        sources: [
          '/api/__sitemap__/urls',
        ],
        exclude: ['/blog/**', '/recette/**'],
      },
      blog: {
        includeAppSources: true,
        sitemapName: 'sitemap-blog.xml',
        defaults: {
          changefreq: 'daily' as const,
          priority: 0.8,
        },
        exclude: ['/recette/**', '/'],
        sources: [
          '/api/__sitemap__/urls',
        ],
      },
      recipes: {
        includeAppSources: true,
        sitemapName: 'sitemap-recipes.xml',
        defaults: {
          changefreq: 'daily' as const,
          priority: 0.8,
        },
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
