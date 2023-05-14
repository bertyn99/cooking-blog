// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    "@nuxtjs/tailwindcss",
    "nuxt-icon",
    "@nuxtjs/strapi",
    "@nuxt/image-edge",
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
  strapi: {
    // Options
  },
  tailwindcss: {
    cssPath: "~/assets/css/index.css",
    configPath: "~/tailwind.config.ts",
  },
  /*  devServer: {
    https: {
      key: "localhost-key.pem",
      cert: "localhost.pem",
    },
  }, */
});
