<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    slotId: string;
    format?: "auto" | "fluid" | "rectangle";
    class?: string;
  }>(),
  { format: "auto" },
);

const { public: config } = useRuntimeConfig();
const { consented } = useAdConsent();

const ins = ref<HTMLElement | null>(null);
let pushed = false;

// Ads are not a supported Partytown library (DOM measurements + iframes), so
// the registry script loads on the main thread. The consent trigger keeps it
// completely idle — zero network requests — until the CMP grants consent.
const script = useScriptGoogleAdsense({
  client: String(config.adsenseClient),
  scriptOptions: {
    trigger: useScriptTriggerConsent({ consent: consented }),
  },
});

function pushAd() {
  if (pushed || !import.meta.client || !ins.value) return;
  pushed = true;
  window.adsbygoogle = window.adsbygoogle || [];
  window.adsbygoogle.push({});
}

onMounted(() => {
  if (!consented.value) return;
  // `onLoaded` covers the pending case; the status check covers a script that
  // already loaded for an earlier slot or page.
  if (script.status.value === "loaded") pushAd();
  else script.onLoaded(pushAd);
});

watch(consented, (granted) => {
  if (granted) script.onLoaded(pushAd);
});
</script>

<template>
  <aside class="ad-slot my-8 w-full print:hidden" :class="$props.class">
    <p
      class="mb-2 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400"
    >
      Publicité
    </p>
    <!-- Fixed min-height reserves the space before the ad iframe lands (CLS). -->
    <ins
      ref="ins"
      class="adsbygoogle block w-full"
      style="display: block; min-height: 280px"
      :data-ad-client="String(config.adsenseClient)"
      :data-ad-slot="slotId"
      :data-ad-format="format"
      data-full-width-responsive="true"
    />
  </aside>
</template>
