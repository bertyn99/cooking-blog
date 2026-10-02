import { Fragment, type Node as ProseMirrorNode, type Schema } from '@tiptap/pm/model'
import type { Transaction } from '@tiptap/pm/state'

/**
 * Pack flat MDC grid children into column stacks (CSS grid row-major).
 * Block i → column (i % colCount).
 */
export function packBlocksIntoColumns<T>(blocks: T[], colCount: number): T[][] {
  const n = Math.min(4, Math.max(1, colCount))
  const columns: T[][] = Array.from({ length: n }, () => [])
  for (let i = 0; i < blocks.length; i++) {
    columns[i % n]!.push(blocks[i]!)
  }
  return columns
}

/**
 * Zip column stacks back to a flat child list (inverse of packBlocksIntoColumns).
 */
export function zipColumnsToBlocks<T>(columns: T[][]): T[] {
  if (columns.length === 0) return []
  const max = Math.max(0, ...columns.map(col => col.length))
  const out: T[] = []
  for (let row = 0; row < max; row++) {
    for (const col of columns) {
      const block = col[row]
      if (block !== undefined) out.push(block)
    }
  }
  return out
}

export function clampGridCols(value: unknown): number {
  const n = Number.parseInt(String(value ?? 2), 10)
  if (!Number.isFinite(n)) return 2
  return Math.min(4, Math.max(1, n))
}

/** Add / remove / merge `gridColumn` children so childCount matches `nextCols`. */
export function syncGridColumnCount(options: {
  grid: ProseMirrorNode
  gridPos: number
  nextCols: number
  tr: Transaction
  schema: Schema
  dispatch?: ((tr: Transaction) => void) | false | undefined
}): boolean {
  const { grid, gridPos, schema, dispatch } = options
  const nextCols = clampGridCols(options.nextCols)
  const tr = options.tr

  tr.setNodeMarkup(gridPos, undefined, { ...grid.attrs, cols: nextCols })

  const current = grid.childCount
  if (nextCols === current) {
    dispatch?.(tr)
    return true
  }

  const columnType = schema.nodes.gridColumn
  const paragraphType = schema.nodes.paragraph
  if (!columnType || !paragraphType) return false

  if (nextCols > current) {
    let insertAt = gridPos + 1
    for (let i = 0; i < current; i++) {
      insertAt += grid.child(i).nodeSize
    }
    for (let i = current; i < nextCols; i++) {
      const empty = columnType.create(null, paragraphType.create())
      tr.insert(insertAt, empty)
      insertAt += empty.nodeSize
    }
    dispatch?.(tr)
    return true
  }

  const kept: ProseMirrorNode[] = []
  for (let i = 0; i < nextCols; i++) {
    kept.push(grid.child(i))
  }

  const overflowBlocks: ProseMirrorNode[] = []
  for (let i = nextCols; i < current; i++) {
    grid.child(i).forEach((child) => {
      overflowBlocks.push(child)
    })
  }

  if (overflowBlocks.length > 0) {
    const last = kept[nextCols - 1]!
    const merged = last.content.append(Fragment.from(overflowBlocks))
    kept[nextCols - 1] = last.copy(merged)
  }

  const from = gridPos + 1
  const to = gridPos + grid.nodeSize - 1
  tr.replaceWith(from, to, Fragment.from(kept))
  dispatch?.(tr)
  return true
}
