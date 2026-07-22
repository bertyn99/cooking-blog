// https://nuxt.com/docs/api/configuration/nuxt-config
import { fileURLToPath } from "node:url";
import listRedirects from "./app/utils/redirect";
import tailwindcss from "@tailwindcss/vite";

const webRoot = fileURLToPath(new URL(".", import.meta.url));

export default defineNuxtConfig({
  compatibilityDate: '2026-07-20',

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
    "@nuxtjs/seo",
    "nuxt-ai-ready",
    "nuxt-skew-protection",
    "@nuxt/fonts",
    "@nuxt/icon",
    "@nuxtjs/partytown",
    "@nuxt/image",
    "@vueuse/nuxt",
    "@nuxtjs/mdc",
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
    "nuxt-umami",
  ],

  css: ['~/assets/css/index.css'],

  vite: {
    plugins: [tailwindcss()],
  },

  routeRules: {
    "/": { isr: 60 * 15 },
    "/blog/**": { isr: 60 * 25 },
    "/images/**": {
      isr: 60 * 60 * 24 * 30,
      headers: {
        'Cache-Control': 'public, max-age=31536000, stale-while-revalidate=604800',
      },
    },
    "/sitemap.xml": { isr: 60 * 60 * 24 },
    "/rss.xml": { isr: 60 * 60 * 24 * 3 },
    "/preview": { robots: false },
    "/preview/**": { robots: false },
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
    preset: 'cloudflare_module',
    compatibilityDate: '2026-05-27',
    cloudflare: {
      deployConfig: true,
      wrangler: {
        images: {
          binding: 'IMAGES',
        },
        d1_databases: [
          {
            binding: 'AI_READY_DB',
            database_name: 'ai-ready-local',
            database_id: 'ai-ready-local',
          },
        ],
        kv_namespaces: [
          {
            binding: 'SKEW_PROTECTION',
            id: 'skew-protection-local',
          },
        ],
      },
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
    description:
      "Bienvenu sur le journal du cuistot, un blog de recettes de cuisine d'un globe trotter",
    defaultLocale: "fr",
  },

  seo: {
    meta: {
      ogLocale: "fr_FR",
      ogType: "website",
      twitterCard: "summary_large_image",
    },
  },

  aiReady: {
    database: {
      type: "d1",
      bindingName: "AI_READY_DB",
    },
    contentSignal: {
      aiTrain: true,
      search: true,
      aiInput: true,
    },
    llmsTxt: {
      sections: [
        {
          title: "Contenu",
          links: [
            {
              title: "Blog",
              href: "/blog",
              description: "Articles et actualités cuisine",
            },
            {
              title: "Recettes",
              href: "/recette",
              description: "Catalogue des recettes",
            },
          ],
        },
        {
          title: "Flux et index",
          links: [
            {
              title: "RSS",
              href: "/rss.xml",
              description: "Flux RSS du site",
            },
            {
              title: "Index IA",
              href: "/api/sitemap-ia",
              description: "Routes groupées pour agents",
            },
            {
              title: "Plan du site",
              href: "/sitemap.xml",
              description: "Index XML des sitemaps",
            },
          ],
        },
      ],
      notes:
        "Journal du cuistot — recettes et articles de cuisine en français (fr-FR).",
    },
  },

  skewProtection: {
    updateStrategy: "polling",
    storage: {
      driver: "cloudflare-kv-binding",
      binding: "SKEW_PROTECTION",
    },
  },

  experimental: {
    checkOutdatedBuildInterval: 5 * 60 * 1000,
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
    exclude: [
      "/preview",
      "/preview/**",
      "/api/**",
      "/images/**",
    ],
    sitemaps: {
      pages: {
        includeAppSources: true,
        sitemapName: "sitemap-pages.xml",
        sources: ["/api/__sitemap__/urls"],
        exclude: ["/blog", "/blog/**", "/recette", "/recette/**"],
        defaults: {
          changefreq: "daily" as const,
          priority: 0.8,
        },
      },
      blog: {
        includeAppSources: true,
        include: ["/blog", "/blog/**"],
        sitemapName: "sitemap-blog.xml",
        sources: ["/api/__sitemap__/urls"],
        defaults: {
          changefreq: "daily" as const,
          priority: 0.8,
        },
      },
      recipes: {
        includeAppSources: true,
        include: ["/recette", "/recette/**"],
        sitemapName: "sitemap-recipes.xml",
        sources: ["/api/__sitemap__/urls"],
        defaults: {
          changefreq: "daily" as const,
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
    enabled: true
  }
});