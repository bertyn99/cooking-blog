import { mergeAttributes, Node } from '@tiptap/core'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import GridColumnNodeView from '~/components/content/editor/GridColumnNodeView.vue'

/**
 * One editable column inside a `grid` node.
 * Not present in markdown — only used in the TipTap document model.
 */
export const ContentGridColumn = Node.create({
  name: 'gridColumn',
  /** Custom group so columns cannot be inserted at the document root. */
  group: 'gridColumn',
  content: 'block+',
  defining: true,
  isolating: true,
  draggable: true,

  parseHTML() {
    return [{ tag: 'div[data-type="grid-column"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes({ 'data-type': 'grid-column' }, HTMLAttributes),
      0,
    ]
  },

  addNodeView() {
    return VueNodeViewRenderer(GridColumnNodeView)
  },

  // Columns are an editor-only structure; never emit as markdown tokens.
  renderMarkdown: (node, h) => h.renderChildren(node.content || [], '\n\n'),
})
