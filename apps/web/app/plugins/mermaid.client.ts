import type Mermaid from "mermaid";

let mermaidModule: typeof Mermaid | null = null;

async function loadMermaid(): Promise<typeof Mermaid> {
  if (!mermaidModule) {
    const { default: mermaid } = await import("mermaid");
    mermaidModule = mermaid;
  }
  return mermaidModule;
}

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.provide("mermaid", loadMermaid);
});
