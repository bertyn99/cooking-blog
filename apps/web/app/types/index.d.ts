import type Mermaid from "mermaid";

declare module "#app" {
  interface NuxtApp {
    $mermaid: () => Promise<typeof Mermaid>;
  }
}
