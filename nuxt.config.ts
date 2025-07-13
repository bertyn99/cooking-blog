// https://nuxt.com/docs/api/configuration/nuxt-config
import listRedirects from "./utils/redirect";

export default defineNuxtConfig({
  /*  future: { compatibilityVersion: 4 }, */
  compatibilityDate: '2024-11-01',

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
    "@nuxt-alt/proxy",
    "@nuxt/icon",
    "@nuxtjs/strapi",
    "@nuxtjs/partytown",
    "@nuxt/image",
    '@nuxtjs/seo',
    "@vueuse/nuxt",
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
    "/uploads/**": { isr: 60 * 60 * 24 * 5 },
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
    storage: {
      cache: { driver: "redis", url: process.env.REDIS_URL },
    },
  },

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
          baseURL: `/uploads/`,
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

  proxy: {
    proxies: {
      // Using the proxy instance
      "/uploads/": {
        target: process.env.STRAPI_URL + "/uploads/",
        changeOrigin: true,
        rewrite: (path: string) => path.replace(/^\/uploads/, ""),
      },
    },
  },

  strapi: {
    url: process.env.STRAPI_URL || "http://localhost:1337",
    prefix: "/api",
    version: "v5",
    cookie: {},
    cookieName: "strapi_jwt",
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
    sources: [
      '/api/__sitemap__/urls',
    ]
  }


  /*  devServer: {
    https: {
      key: "localhost-key.pem",
      cert: "localhost.pem",
    },
  }, */,

  devtools: {
    enabled: true
  }
});
