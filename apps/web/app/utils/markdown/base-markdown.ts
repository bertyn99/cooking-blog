import { defineMarkdownComponent } from "@comark/vue";
import emoji from "comark/plugins/emoji";
import mermaid from "comark/plugins/mermaid";
import toc from "comark/plugins/toc";
import { buildComarkProseComponents } from "~/utils/comark-prose-components";

export const BaseMarkdown = defineMarkdownComponent({
  name: "BaseMarkdown",
  plugins: [emoji(), mermaid(), toc()],
  components: buildComarkProseComponents(),
});
