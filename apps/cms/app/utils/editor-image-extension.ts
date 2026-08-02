import { mergeAttributes } from '@tiptap/core'
import Image from '@tiptap/extension-image'
import { contentImageClassList } from '#shared/content-image'

/**
 * TipTap Image that applies Tailwind aspect classes from markdown `title`
 * (`![alt](src "16:9")` → `aspect-[16/9]` on the `<img>`).
 */
export const ContentImage = Image.extend({
  renderHTML({ HTMLAttributes }) {
    const { class: _ignored, ...attrs } = HTMLAttributes as Record<string, unknown> & {
      class?: string
      title?: string | null
    }
    return [
      'img',
      mergeAttributes(this.options.HTMLAttributes, attrs, {
        class: contentImageClassList(
          typeof attrs.title === 'string' ? attrs.title : null,
        ),
      }),
    ]
  },
})
