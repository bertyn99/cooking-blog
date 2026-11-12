const STORAGE_KEY = "jdc-ads-consent";
const STORAGE_VERSION = 1;

export type AdsConsentMode = "local" | "google-cmp";

interface StoredAdsConsent {
  v?: number;
  ads?: boolean;
  ts?: string;
}

/**
 * Ad consent shared by the ad slots, the consent banner and the footer link.
 *
 * Two deployment modes (`NUXT_PUBLIC_ADS_CONSENT_MODE`):
 * - `local` (default): the first-party banner gates the AdSense tag. Nothing
 *   loads — no request, no cookie — until the visitor accepts.
 * - `google-cmp`: AdSense's certified consent message owns the prompt. The tag
 *   must load before any interaction for that message to render, so consent is
 *   granted up front and the local banner stays hidden.
 *
 * The local banner is NOT a Google-certified CMP: `local` mode only satisfies
 * Google's EU consent policy outside the EEA/UK, or once a certified CMP is
 * layered on top (Axeptio, Didomi, Cookiebot, Google's own message).
 */
export function useAdConsent() {
  const { public: config } = useRuntimeConfig();

  const mode = computed<AdsConsentMode>(() =>
    config.adsConsentMode === "google-cmp" ? "google-cmp" : "local",
  );
  const usesGoogleCmp = computed(() => mode.value === "google-cmp");
  // Without a client id there is no ad tag at all, hence nothing to consent to.
  const adsConfigured = computed(() => Boolean(config.adsenseClient));

  // Google's message needs the tag loaded unconditionally, so `google-cmp`
  // starts as decided + consented; the local banner never opens in that mode.
  const consented = useState<boolean>("ads-consent", () => usesGoogleCmp.value);
  const decided = useState<boolean>(
    "ads-consent-decided",
    () => usesGoogleCmp.value,
  );
  const bannerOpen = useState<boolean>("ads-consent-banner", () => false);
  const restored = useState<boolean>("ads-consent-restored", () => false);

  function writeRecord(ads: boolean) {
    if (!import.meta.client) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          v: STORAGE_VERSION,
          ads,
          ts: new Date().toISOString(),
        } satisfies StoredAdsConsent),
      );
    } catch {
      // Private mode / blocked storage: the in-memory choice still applies for
      // this visit; the banner asks again next time.
    }
  }

  /**
   * Read the stored decision once per visit. Kept out of setup (where a
   * localStorage read would desync SSR and hydration) and idempotent, so it can
   * also run on demand before the banner opens.
   */
  function restoreConsent() {
    if (!import.meta.client || restored.value || usesGoogleCmp.value) return;
    restored.value = true;

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;

      // Record written by the first AdSense build (bare "granted").
      if (raw === "granted") {
        consented.value = true;
        decided.value = true;
        return;
      }

      const record = JSON.parse(raw) as StoredAdsConsent;
      // A version bump re-asks: old choices may not match the current wording.
      if (record?.v !== STORAGE_VERSION || typeof record.ads !== "boolean") return;

      consented.value = record.ads;
      decided.value = true;
    } catch {
      // Corrupt or unavailable storage: treat as undecided.
    }
  }

  function decideAds(ads: boolean) {
    decided.value = true;
    consented.value = ads;
    bannerOpen.value = false;
    writeRecord(ads);
  }

  function grantAdsConsent() {
    decideAds(true);
  }

  function revokeAdsConsent() {
    decideAds(false);
  }

  function openConsentBanner() {
    restoreConsent();
    bannerOpen.value = true;
  }

  function closeConsentBanner() {
    bannerOpen.value = false;
  }

  // Whichever component asks first restores the choice for everyone.
  onMounted(restoreConsent);

  return {
    mode,
    usesGoogleCmp,
    adsConfigured,
    consented,
    decided,
    bannerOpen,
    restoreConsent,
    decideAds,
    grantAdsConsent,
    revokeAdsConsent,
    openConsentBanner,
    closeConsentBanner,
  };
}
