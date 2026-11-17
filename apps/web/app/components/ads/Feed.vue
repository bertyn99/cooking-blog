<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    placement: "feedRecipes" | "feedArticles";
    /** Grid cell (recipe cards) vs stacked row (article list). */
    dense?: boolean;
    class?: string;
  }>(),
  { dense: false },
);

const { public: config } = useRuntimeConfig();
const { consented } = useAdConsent();

const slotId = computed(() => {
  const raw = config.adsenseSlots?.[props.placement];
  return raw ? String(raw) : "";
});
const layoutKey = computed(() => {
  const raw = config.adsenseLayoutKeys?.[props.placement];
  return raw ? String(raw) : "";
});
const enabled = computed(
  () =>
    Boolean(config.adsenseClient)
    && Boolean(slotId.value)
    && Boolean(layoutKey.value)
    && consented.value,
);

const ins = ref<HTMLElement | null>(null);
let pushed = false;

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
  if (!enabled.value) return;
  if (script.status.value === "loaded") pushAd();
  else script.onLoaded(pushAd);
});

watch(enabled, (ready) => {
  if (ready) script.onLoaded(pushAd);
});
</script>

<template>
  <aside
    v-if="enabled"
    class="ad-slot print:hidden"
    :class="[dense ? 'col-span-1 flex flex-col' : 'w-full', $props.class]"
  >
    <p
      class="mb-2 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400"
    >
      Publicité
    </p>
    <ins
      ref="ins"
      class="adsbygoogle block w-full"
      style="display: block"
      :data-ad-client="String(config.adsenseClient)"
      :data-ad-slot="slotId"
      data-ad-format="fluid"
      :data-ad-layout-key="layoutKey"
    />
  </aside>
</template>
