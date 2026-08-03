import { mergeAttributes } from '@tiptap/core'
import Image from '@tiptap/extension-image'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import ImageNodeView from '~/components/content/editor/ImageNodeView.vue'
import {
  contentImageClassList,
  isLikelyBrokenContentImageSrc,
} from '#shared/content-image'

/**
 * TipTap Image that applies Tailwind aspect classes from markdown `title`
 * (`![alt](src "16:9")` → `aspect-[16/9]` on the `<img>`).
 * Marks broken/orphan srcs with `data-broken` for editor affordance.
 */
export const ContentImage = Image.extend({
  // Block images play nicer inside MDC grids / callouts than inline floats.
  inline: false,
  group: 'block',

  addAttributes() {
    return {
      ...this.parent?.(),
      'data-broken': {
        default: null,
        parseHTML: element => element.getAttribute('data-broken'),
        renderHTML: (attributes) => {
          if (!attributes['data-broken']) return {}
          return { 'data-broken': attributes['data-broken'] }
        },
      },
    }
  },

  addNodeView() {
    return VueNodeViewRenderer(ImageNodeView)
  },

  renderHTML({ HTMLAttributes }) {
    const { class: _ignored, ...attrs } = HTMLAttributes as Record<string, unknown> & {
      class?: string
      title?: string | null
      src?: string | null
    }
    const src = typeof attrs.src === 'string' ? attrs.src : ''
    const likelyBroken = isLikelyBrokenContentImageSrc(src)

    return [
      'img',
      mergeAttributes(this.options.HTMLAttributes, attrs, {
        class: contentImageClassList(
          typeof attrs.title === 'string' ? attrs.title : null,
        ),
        ...(likelyBroken ? { 'data-broken': 'true' } : {}),
      }),
    ]
  },
})
