import { mergeAttributes, Node } from '@tiptap/core'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import GridNodeView from '~/components/content/editor/GridNodeView.vue'
import {
  clampGridCols,
  syncGridColumnCount,
} from '~/utils/editor-grid-columns'
import {
  parseGridMarkdownToken,
  renderGridMarkdownNode,
} from '~/utils/editor-grid-markdown'
import { createMdcContainerMarkdownSpec } from '~/utils/editor-mdc-container'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    grid: {
      setGrid: (attrs?: { cols?: number }) => ReturnType
      setGridCols: (cols: number) => ReturnType
    }
  }
}

const baseMarkdown = createMdcContainerMarkdownSpec({
  nodeName: 'grid',
  allowedAttributes: ['cols'],
  defaultAttributes: { cols: 2 },
})

function emptyColumnJson() {
  return {
    type: 'gridColumn',
    content: [{ type: 'paragraph' }],
  }
}

export const ContentGrid = Node.create({
  name: 'grid',
  group: 'block',
  content: 'gridColumn+',
  defining: true,
  isolating: true,

  addAttributes() {
    return {
      cols: {
        default: 2,
        parseHTML: element => clampGridCols(element.getAttribute('data-cols')),
        renderHTML: attributes => ({
          'data-cols': String(clampGridCols(attributes.cols)),
        }),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-type="grid"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes({ 'data-type': 'grid' }, HTMLAttributes),
      0,
    ]
  },

  addCommands() {
    return {
      setGrid: attrs => ({ commands }) => {
        const cols = clampGridCols(attrs?.cols ?? 2)
        return commands.insertContent({
          type: this.name,
          attrs: { cols },
          content: Array.from({ length: cols }, () => emptyColumnJson()),
        })
      },

      setGridCols: cols => ({ state, dispatch }) => {
        const { $from } = state.selection
        let gridDepth = -1
        for (let d = $from.depth; d > 0; d--) {
          if ($from.node(d).type.name === 'grid') {
            gridDepth = d
            break
          }
        }
        if (gridDepth < 0) return false

        const grid = $from.node(gridDepth)
        const gridPos = $from.before(gridDepth)
        return syncGridColumnCount({
          grid,
          gridPos,
          nextCols: cols,
          tr: state.tr,
          schema: state.schema,
          dispatch,
        })
      },
    }
  },

  addNodeView() {
    return VueNodeViewRenderer(GridNodeView)
  },

  markdownTokenizer: baseMarkdown.markdownTokenizer,

  parseMarkdown: (token, h) => parseGridMarkdownToken(token, h),

  renderMarkdown: (node, h) => renderGridMarkdownNode(node, h),
})
