// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  app: {
    head: {
      link: [{ rel: "icon", type: "image/webp", href: "/img/logo.webp" }],
      script: [
        {
          src: "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5406721051491594",
          async: true,
          crossorigin: "anonymous",
          type: "text/partytown",
        },
      ],
    },
  },
  modules: [
    "@nuxtjs/tailwindcss",
    "@nuxt-alt/proxy",
    "nuxt-icon",
    "@nuxtjs/plausible",
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
  nitro: {
    prerender: {
      routes: ["rss.xml", "sitemap.xml"],
    },
  },
  proxy: {
    proxies: {
      // Using the proxy instance
      "/uploads/": {
        target: "https://admin.journalducuistot.fr/uploads",
        changeOrigin: true,
        rewrite: (path: string) => path.replace(/^\/uploads/, ""),
      },
    },
  },
  vue: {
    defineModel: true,
    propsDestructure: true,
  },
  plausible: {
    domain: "journalducuistot.fr",
    apiHost: "https://analytics.bertynboulikou.com",
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
