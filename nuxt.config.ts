// https://nuxt.com/docs/api/configuration/nuxt-config
import listRedirects from "./utils/redirect";

export default defineNuxtConfig({
  app: {
    head: {
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
    "nuxt-icon",
    "@nuxtjs/strapi",
    "@nuxtjs/partytown",
    "@nuxt/image",
    "nuxt-schema-org",
    "@vueuse/nuxt",
    [
      "@nuxtjs/google-fonts",
      {
        families: {
          Merriweather: true,
          "Merriweather+Sans": true,
          Catamaran: true,
          download: true,
          inject: true,
        },
      },
    ],
  ],
  extends: ['nuxt-umami'],
  routeRules: {
    "/": { isr: 60 * 15 },
    "/blog/**": { isr: 60 * 25 },
    "/uploads/**": { isr: 60 * 60 * 24 * 5 },
    "/sitemap.xml": { isr: 60 * 60 * 24 },
    "/rss.xml": { isr: 60 * 60 * 24 * 3 },
    ...listRedirects,
  },
  nitro: {
    storage: {
      cache: { driver: "redis", url: process.env.REDIS_URL },
    },
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
  vue: {
    defineModel: true,
    propsDestructure: true,
  },
  strapi: {
    url: process.env.STRAPI_URL || "http://localhost:1337",
    prefix: "/api",
    version: "v4",
    cookie: {},
    cookieName: "strapi_jwt",
  },

  tailwindcss: {
    cssPath: "~/assets/css/index.css",
    configPath: "~/tailwind.config.ts",
  },
  runtimeConfig: {
    public: {
      siteUrl:
        process.env.NUXT_PUBLIC_SITE_URL || "https://journalducuistot.fr/",
      titleSeparator: "|",
      siteName: "Journal du cuistot",
      siteDescription:
        "Bienvenu sur le journal du cuistot, un blog de recettes de cuisine d'un globe trotter",
      language: "fr-FR", // prefer more explicit language codes like `en-AU` over `en`
    },
  },
  schemaOrg: {
    canonicalHost: "https://journalducuistot.fr/",
  },
  /*  devServer: {
    https: {
      key: "localhost-key.pem",
      cert: "localhost.pem",
    },
  }, */
});
