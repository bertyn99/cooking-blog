import { defineMarkdownComponent } from '@comark/vue'
import { buildContentBlockClients } from '@journalducuistot/shared/markdown'

/**
 * Comark MDX for editor Aperçu and Vue simple prose regions.
 * `img` uses the shared Image Client.
 */
export const PreviewMarkdown = defineMarkdownComponent({
  name: 'PreviewMarkdown',
  components: buildContentBlockClients(),
  class: 'max-w-none',
})
