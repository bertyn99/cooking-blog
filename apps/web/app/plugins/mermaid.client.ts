import type Mermaid from "mermaid";
import { jdcMermaidConfig } from "~/utils/jdc-mermaid";

let mermaidModule: typeof Mermaid | null = null;

async function loadMermaid(): Promise<typeof Mermaid> {
  if (!mermaidModule) {
    const { default: mermaid } = await import("mermaid");
    mermaid.initialize(jdcMermaidConfig);
    mermaidModule = mermaid;
  }
  return mermaidModule;
}

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.provide("mermaid", loadMermaid);
});
