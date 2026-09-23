import type Mermaid from "mermaid";
import type { $Fetch } from "ofetch";

declare module "#app" {
  interface NuxtApp {
    $mermaid: () => Promise<typeof Mermaid>;
    /** Preconfigured ofetch client (`baseURL` = CMS `/api`). */
    $cms: $Fetch;
  }
}
