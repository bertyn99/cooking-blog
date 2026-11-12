import { defineMarkdownComponent } from "@comark/vue";
import emoji from "comark/plugins/emoji";
import toc from "comark/plugins/toc";
import pele from "comark-pele";
import { buildComarkProseComponents } from "~/utils/comark-prose-components";

export const BaseMarkdown = defineMarkdownComponent({
  name: "BaseMarkdown",
  plugins: [emoji(), pele(), toc()],
  components: buildComarkProseComponents(),
});
