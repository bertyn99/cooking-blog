import {
  clampGridCols,
  packBlocksIntoColumns,
  zipColumnsToBlocks,
} from './editor-grid-columns'
import { serializeMdcAttributes } from './editor-mdc-container'

export type GridMarkdownHelpers = {
  parseChildren: (tokens: unknown[]) => unknown
  createNode: (type: string, attrs: Record<string, unknown>, content: unknown) => unknown
  renderChildren: (content: unknown[], separator?: string) => string
}

export function isEmptyParagraphJson(block: unknown): boolean {
  if (!block || typeof block !== 'object') return false
  const b = block as { type?: string, content?: unknown[] }
  return b.type === 'paragraph' && (!b.content || b.content.length === 0)
}

/** Build TipTap grid JSON from flat MDC children (one block per CSS grid cell). */
export function parseGridMarkdownToken(
  token: { attributes?: Record<string, unknown>, tokens?: unknown[] },
  h: Pick<GridMarkdownHelpers, 'parseChildren' | 'createNode'>,
) {
  const cols = clampGridCols(token.attributes?.cols ?? 2)
  const rawChildren = (h.parseChildren(token.tokens || []) || []) as unknown[]
  const packed = packBlocksIntoColumns(rawChildren, cols)
  const columnNodes = packed.map((blocks) => {
    const content = blocks.length > 0 ? blocks : [h.createNode('paragraph', {}, [])]
    return h.createNode('gridColumn', {}, content)
  })
  while (columnNodes.length < cols) {
    columnNodes.push(h.createNode('gridColumn', {}, [h.createNode('paragraph', {}, [])]))
  }
  return h.createNode('grid', { cols }, columnNodes)
}

/** Flatten column stacks back to MDC `::grid` body markdown. */
export function renderGridMarkdownNode(
  node: { attrs?: Record<string, unknown>, content?: unknown[] },
  h: Pick<GridMarkdownHelpers, 'renderChildren'>,
): string {
  const cols = clampGridCols(node.attrs?.cols)
  const columnNodes = (node.content || []) as Array<{ content?: unknown[] }>
  const stacks = columnNodes.map((col) => {
    const blocks = col.content || []
    if (blocks.length === 1 && isEmptyParagraphJson(blocks[0])) {
      return [] as unknown[]
    }
    return blocks
  })
  const allEmpty = stacks.every(s => s.length === 0)
  const flat = allEmpty
    ? [{ type: 'paragraph', content: [] }]
    : zipColumnsToBlocks(stacks)
  const attrs = serializeMdcAttributes({ cols })
  const attrString = attrs ? `{${attrs}}` : ''
  const rendered = h.renderChildren(flat as never[], '\n\n')
  return `::grid${attrString}\n\n${rendered}\n\n::`
}
