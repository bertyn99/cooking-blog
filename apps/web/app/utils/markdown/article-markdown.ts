import ProseCallout from "~/components/prose/Callout.vue";
import ProseGrid from "~/components/prose/Grid.vue";
import { BaseMarkdown } from "~/utils/markdown/base-markdown";
import { defineMarkdownComponent } from "@comark/vue";

export const ArticleMarkdown = defineMarkdownComponent({
  name: "ArticleMarkdown",
  extends: BaseMarkdown,
  components: {
    callout: ProseCallout,
    Callout: ProseCallout,
    grid: ProseGrid,
    Grid: ProseGrid,
  },
});
