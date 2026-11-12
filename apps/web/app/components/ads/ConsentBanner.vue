<script setup lang="ts">
const {
  mode,
  adsConfigured,
  consented,
  decided,
  bannerOpen,
  restoreConsent,
  decideAds,
  openConsentBanner,
} = useAdConsent();

const heading = ref<HTMLElement | null>(null);
const liveMessage = ref("");
const customizeOpen = ref(false);
const adsDraft = ref(false);

// `google-cmp` leaves the prompt to Google's certified message; without a
// client id there is no ad tag, hence nothing to consent to.
const visible = computed(
  () => mode.value === "local" && adsConfigured.value && bannerOpen.value,
);

onMounted(() => {
  restoreConsent();
  if (mode.value !== "local" || !adsConfigured.value || decided.value) return;
  customizeOpen.value = false;
  openConsentBanner();
});

// Focus the heading when the banner opens (non-modal: no focus trap, the page
// stays reachable behind it).
watch(
  visible,
  (open) => {
    if (!open) return;
    nextTick(() => heading.value?.focus());
  },
  { flush: "post" },
);

/**
 * The live region lives outside the `v-if`, so it survives the banner closing —
 * otherwise the announcement would be removed from the accessibility tree in
 * the same frame the text changed.
 */
function announce(message: string) {
  liveMessage.value = "";
  nextTick(() => {
    liveMessage.value = message;
  });
}

/** Hand focus back to the page after the banner disappears. */
function returnFocusToPage() {
  nextTick(() => {
    const main = document.querySelector("main");
    if (!main) return;
    main.setAttribute("tabindex", "-1");
    main.focus({ preventScroll: true });
  });
}

const MESSAGE_ACCEPT =
  "Publicité acceptée. Les annonces Google peuvent se charger.";
const MESSAGE_REFUSE =
  "Publicité refusée. Aucun cookie publicitaire n'a été déposé.";

function choose(ads: boolean, message: string) {
  decideAds(ads);
  announce(message);
  returnFocusToPage();
}

function acceptAll() {
  choose(true, MESSAGE_ACCEPT);
}

function refuseAll() {
  choose(false, MESSAGE_REFUSE);
}

function toggleCustomize() {
  customizeOpen.value = !customizeOpen.value;
  if (!customizeOpen.value) return;
  // Reflect the current decision instead of a fresh default; a first visit has
  // no decision, so the advertising toggle starts off (never pre-ticked).
  adsDraft.value = consented.value;
}

function saveCustomize() {
  choose(adsDraft.value, adsDraft.value ? MESSAGE_ACCEPT : MESSAGE_REFUSE);
}
</script>

<template>
  <p class="sr-only" role="status" aria-live="polite">{{ liveMessage }}</p>

  <div
    v-if="visible"
    class="pointer-events-none fixed inset-x-0 bottom-0 z-[70] p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] print:hidden"
  >
    <div
      role="dialog"
      aria-labelledby="ads-consent-title"
      aria-describedby="ads-consent-desc"
      class="pointer-events-auto mx-auto max-h-[70vh] w-full max-w-3xl overflow-y-auto rounded-lg border border-neutral-200 bg-white p-4 shadow-2xl md:p-6"
    >
      <h2
        id="ads-consent-title"
        ref="heading"
        tabindex="-1"
        class="text-base font-bold text-neutral-900 focus:outline-none md:text-lg"
      >
        Cookies et publicité
      </h2>

      <p id="ads-consent-desc" class="mt-2 text-sm text-neutral-600">
        Google AdSense finance ce site. Sans votre accord, aucune annonce ne se
        charge et aucun cookie publicitaire n'est déposé. La mesure d'audience
        (Umami) est sans cookie et ne demande pas de consentement.
        <NuxtLink
          to="/politique-de-confidentialite"
          class="font-semibold text-neutral-900 underline underline-offset-2"
        >
          Politique de confidentialité
        </NuxtLink>
      </p>

      <div class="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
        <button
          type="button"
          class="inline-flex w-full items-center justify-center rounded-md px-3 py-2.5 text-sm font-semibold text-neutral-700 underline underline-offset-4 hover:text-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 sm:w-auto"
          :aria-expanded="customizeOpen"
          aria-controls="ads-consent-customize"
          @click="toggleCustomize"
        >
          Personnaliser
        </button>
        <button
          type="button"
          class="inline-flex w-full items-center justify-center rounded-md border border-neutral-900 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-900 hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 sm:w-40"
          @click="refuseAll"
        >
          Tout refuser
        </button>
        <button
          type="button"
          class="inline-flex w-full items-center justify-center rounded-md border border-neutral-900 bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-neutral-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 sm:w-40"
          @click="acceptAll"
        >
          Tout accepter
        </button>
      </div>

      <div
        v-if="customizeOpen"
        id="ads-consent-customize"
        role="group"
        aria-labelledby="ads-consent-customize-title"
        class="mt-4 border-t border-neutral-200 pt-4"
      >
        <p
          id="ads-consent-customize-title"
          class="text-sm font-semibold text-neutral-900"
        >
          Choisir par finalité
        </p>

        <label class="mt-3 flex cursor-pointer items-start gap-3">
          <input
            v-model="adsDraft"
            type="checkbox"
            class="mt-0.5 h-5 w-5 shrink-0 accent-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
          />
          <span>
            <span class="block text-sm font-semibold text-neutral-900">
              Publicité (Google AdSense)
            </span>
            <span class="block text-xs text-neutral-600">
              Autorise le chargement des annonces et les cookies publicitaires
              de Google. Désactivé, aucune annonce ne s'affiche.
            </span>
          </span>
        </label>

        <p class="mt-3 text-xs text-neutral-500">
          Les cookies strictement nécessaires (session, sécurité) ne requièrent
          pas votre accord.
        </p>

        <div class="mt-3 flex justify-end">
          <button
            type="button"
            class="inline-flex items-center justify-center rounded-md bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-neutral-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
            @click="saveCustomize"
          >
            Enregistrer mes choix
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
