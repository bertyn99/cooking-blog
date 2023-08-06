// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  app: {
    head: {
      link: [{ rel: "icon", type: "image/webp", href: "/img/logo.webp" }],
    },
  },
  modules: [
    "@nuxtjs/tailwindcss",
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
  nitro: {
    prerender: {
      routes: ["rss.xml", "sitemap.xml"],
    },
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
