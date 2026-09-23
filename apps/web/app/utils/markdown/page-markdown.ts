import type { Component } from "vue";
import { defineMarkdownComponent } from "@comark/vue";
import { ArticleMarkdown } from "~/utils/markdown/article-markdown";

/** Section blocks registered only for CMS page markdown (not articles/recipes). */
export function buildPageSectionComponents(): Record<string, Component> {
  const modules = import.meta.glob<{ default: Component }>(
    "~/components/blocks/*.vue",
    { eager: true },
  );

  const components: Record<string, Component> = {};

  for (const [path, mod] of Object.entries(modules)) {
    const fileName = path.split("/").pop()?.replace(/\.vue$/, "");
    if (!fileName || !mod.default) continue;

    const kebab = fileName.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
    components[kebab] = mod.default;
  }

  return components;
}

export const PageMarkdown = defineMarkdownComponent({
  name: "PageMarkdown",
  extends: ArticleMarkdown,
  components: buildPageSectionComponents(),
});
