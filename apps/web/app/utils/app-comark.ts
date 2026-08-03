import { defineComarkComponent } from "@comark/vue";
import emoji from "comark/plugins/emoji";
import mermaid from "comark/plugins/mermaid";
import { buildComarkProseComponents } from "~/utils/comark-prose-components";

export const AppComark = defineComarkComponent({
  name: "AppComark",
  plugins: [emoji(), mermaid()],
  components: buildComarkProseComponents(),
});
