// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    "@nuxtjs/tailwindcss",
    [
      "@storyblok/nuxt",
      {
        accessToken: process.env.STORYBLOK_TOKEN,
        apiOptions: {
          region: "eu",
        },
      },
    ],
  ],
  tailwindcss: {
    cssPath: "~/assets/css/index.css",
    configPath: "~/tailwind.config.ts",
  },
  devServer: {
    https: {
      key: "localhost-key.pem",
      cert: "localhost.pem",
    },
  },
});
