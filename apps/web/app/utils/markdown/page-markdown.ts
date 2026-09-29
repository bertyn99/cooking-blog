import { defineMarkdownComponent } from "@comark/vue";
import { ArticleMarkdown } from "~/utils/markdown/article-markdown";
import { buildContentBlockClients } from "@journalducuistot/shared/markdown";

export const PageMarkdown = defineMarkdownComponent({
  name: "PageMarkdown",
  extends: ArticleMarkdown,
  components: buildContentBlockClients(),
});
