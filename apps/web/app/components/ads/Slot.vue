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
const { consented } = useAdConsent();

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
</script>

<template>
  <AdsUnit
    v-if="enabled && consented"
    :slot-id="slotId"
    :format="format"
    :class="$props.class"
  />
</template>
