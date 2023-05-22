import type { Strapi4Error } from "@nuxtjs/strapi/dist/runtime/types/v4";

export default defineNuxtPlugin((nuxt) => {
  nuxt.hook("strapi:error" as any, (e: Strapi4Error) => {
    nuxt.$toast.error({ title: e.error.name, description: e.error.message });
  });
});
