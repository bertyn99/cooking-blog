import { defineMarkdownComponent } from "@comark/vue";
import { BaseMarkdown } from "~/utils/markdown/base-markdown";
import { buildProseBlockClients } from "@journalducuistot/shared/markdown";

const prose = buildProseBlockClients();

export const ArticleMarkdown = defineMarkdownComponent({
  name: "ArticleMarkdown",
  extends: BaseMarkdown,
  components: prose,
});
