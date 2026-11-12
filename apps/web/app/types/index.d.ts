import type { $Fetch } from "ofetch";
import type { MaybeRefOrGetter } from "vue";
import type { JdcFaqItem } from "@journalducuistot/shared/content-blocks";

declare module "#app" {
  interface NuxtApp {
    /** Preconfigured ofetch client (`baseURL` = CMS `/api`). */
    $cms: $Fetch;
    $jdcFaqSchema: (items: MaybeRefOrGetter<JdcFaqItem[]>) => void;
  }
}
