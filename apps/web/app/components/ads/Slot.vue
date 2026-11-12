<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    placement: "article" | "recipe";
    format?: "auto" | "fluid" | "rectangle";
    class?: string;
  }>(),
  { format: "auto" },
);

const { public: config } = useRuntimeConfig();
const { consented, grantAdsConsent } = useAdConsent();

// Nuxt's runtime env layer coerces digit-only values to numbers, so a slot id
// like `1234567890` can arrive as a number here. Coerce to string to keep
// `data-ad-slot` byte-identical to the id configured in AdSense.
const slotId = computed(() => {
  const raw = config.adsenseSlots?.[props.placement];
  return raw ? String(raw) : "";
});
const enabled = computed(
  () => Boolean(config.adsenseClient) && Boolean(slotId.value),
);
const isDev = import.meta.dev;
</script>

<template>
  <aside
    v-if="isDev && enabled && !consented"
    class="my-8 w-full rounded-md border border-dashed border-neutral-300 p-4 text-center print:hidden"
    aria-label="Publicité (test)"
  >
    <p class="mb-3 text-xs uppercase tracking-widest text-neutral-500">
      Emplacement publicitaire — consentement désactivé en dev
    </p>
    <button
      type="button"
      class="rounded-md bg-neutral-900 px-4 py-2 text-xs font-semibold text-white hover:bg-neutral-700"
      @click="grantAdsConsent()"
    >
      Activer les annonces (dev)
    </button>
  </aside>
  <AdsUnit
    v-else-if="enabled && consented"
    :slot-id="slotId"
    :format="format"
    :class="$props.class"
  />
</template>
