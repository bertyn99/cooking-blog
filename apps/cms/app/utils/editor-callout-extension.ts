import { mergeAttributes, Node } from '@tiptap/core'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import CalloutNodeView from '~/components/content/editor/CalloutNodeView.vue'
import { createMdcContainerMarkdownSpec } from '~/utils/editor-mdc-container'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    callout: {
      setCallout: (attrs?: { type?: string }) => ReturnType
    }
  }
}

const markdown = createMdcContainerMarkdownSpec({
  nodeName: 'callout',
  allowedAttributes: ['type'],
  defaultAttributes: { type: 'info' },
})

export const ContentCallout = Node.create({
  name: 'callout',
  group: 'block',
  content: 'block+',
  defining: true,
  isolating: true,

  addAttributes() {
    return {
      type: {
        default: 'info',
        parseHTML: element => element.getAttribute('data-callout-type') || 'info',
        renderHTML: (attributes) => {
          if (!attributes.type) return {}
          return { 'data-callout-type': attributes.type }
        },
      },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-type="callout"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes({ 'data-type': 'callout' }, HTMLAttributes),
      0,
    ]
  },

  addCommands() {
    return {
      setCallout: attrs => ({ commands }) =>
        commands.insertContent({
          type: this.name,
          attrs: { type: attrs?.type ?? 'info' },
          content: [{ type: 'paragraph' }],
        }),
    }
  },

  addNodeView() {
    return VueNodeViewRenderer(CalloutNodeView)
  },

  parseMarkdown: markdown.parseMarkdown,
  markdownTokenizer: markdown.markdownTokenizer,
  renderMarkdown: markdown.renderMarkdown,
})
