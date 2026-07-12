interface StrapiErrorPayload {
  error: { name: string; message: string };
}

interface ToastService {
  error: (opts: { title: string; description: string }) => void;
}

export default defineNuxtPlugin((nuxt) => {
  nuxt.hook("strapi:error" as "app:error", (e: StrapiErrorPayload) => {
    const toast = (nuxt as typeof nuxt & { $toast?: ToastService }).$toast;
    toast?.error({ title: e.error.name, description: e.error.message });
  });
});
