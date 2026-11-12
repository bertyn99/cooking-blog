const STORAGE_KEY = "jdc-ads-consent";

/**
 * Ad consent state shared by every ad slot.
 *
 * AdSense may only load once a Google-certified CMP has collected consent for
 * EEA/UK visitors. Until that CMP is wired (see YGG-251), nothing calls
 * `grantAdsConsent()` in production: the AdSense script stays unloaded and the
 * slots keep their reserved space.
 *
 * The CMP integration point is `grantAdsConsent()` / `revokeAdsConsent()`.
 */
export function useAdConsent() {
  const consented = useState<boolean>("ads-consent", () => false);

  function grantAdsConsent() {
    consented.value = true;
    if (import.meta.client) {
      try {
        localStorage.setItem(STORAGE_KEY, "granted");
      } catch {
        // Private mode / blocked storage: keep the in-memory consent.
      }
    }
  }

  function revokeAdsConsent() {
    consented.value = false;
    if (import.meta.client) {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // Ignore unavailable storage.
      }
    }
  }

  // Consent is a browser-only fact: restoring it after mount avoids hydration
  // mismatches between the server and the visitor's stored choice.
  onMounted(() => {
    if (!import.meta.client) return;
    try {
      if (localStorage.getItem(STORAGE_KEY) === "granted") {
        consented.value = true;
      }
    } catch {
      // Ignore unavailable storage.
    }
  });

  return { consented, grantAdsConsent, revokeAdsConsent };
}
