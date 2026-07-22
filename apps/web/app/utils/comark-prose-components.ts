import type { Component } from "vue";
import ComarkMermaid from "~/components/comark/Mermaid.vue";
import ComarkProseImg from "~/components/comark/ProseImg.vue";
import ProsePre from "~/components/prose/ProsePre.vue";

const proseModules = import.meta.glob<{ default: Component }>(
  "~/components/prose/*.vue",
  { eager: true },
);

function registerName(
  map: Record<string, Component>,
  name: string,
  component: Component,
) {
  map[name] = component;
  if (name.startsWith("Prose") && name.length > 5) {
    const tag = name.slice(5);
    if (tag) {
      map[tag] = component;
      map[tag.toLowerCase()] = component;
    }
  } else if (name[0] === name[0]?.toUpperCase()) {
    map[name.charAt(0).toLowerCase() + name.slice(1)] = component;
  }
}

export function buildComarkProseComponents(): Record<string, Component> {
  const components: Record<string, Component> = {};

  for (const [path, mod] of Object.entries(proseModules)) {
    const fileName = path.split("/").pop()?.replace(/\.vue$/, "");
    if (!fileName || !mod.default) continue;
    registerName(components, fileName, mod.default);
  }

  registerName(components, "ProsePre", ProsePre);
  registerName(components, "pre", ProsePre);
  registerName(components, "ProseImg", ComarkProseImg);
  registerName(components, "img", ComarkProseImg);
  registerName(components, "Mermaid", ComarkMermaid);
  registerName(components, "mermaid", ComarkMermaid);

  return components;
}
