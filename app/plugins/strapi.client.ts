import type { Strapi4Error, Strapi5Error } from '@nuxtjs/strapi'

export default defineNuxtPlugin((nuxt) => {
  nuxt.hook("strapi:error" as any, (e: Strapi5Error) => {
    nuxt.$toast.error({ title: e.error.name, description: e.error.message });
  });
});
