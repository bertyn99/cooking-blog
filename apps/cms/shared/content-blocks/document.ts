import type { SectionBlockTag } from './catalog'

export type PageBlockId = string

export interface SectionBlock {
  id: PageBlockId
  kind: 'section'
  tag: SectionBlockTag
  props: Record<string, string | number | boolean>
  slots: Record<string, string>
}

export interface ProseRegion {
  id: PageBlockId
  kind: 'prose'
  markdown: string
}

export type PageBlock = SectionBlock | ProseRegion

export interface PageDocument {
  blocks: PageBlock[]
}

export function createBlockId(prefix: string, index: number, suffix = ''): PageBlockId {
  return suffix ? `${prefix}-${index}-${suffix}` : `${prefix}-${index}`
}

/** Stable id that does not collide after delete + insert (length-based ids can reuse a live key). */
export function nextUnusedBlockId(
  blocks: Array<{ id: string }>,
  prefix: string,
  suffix = '',
): PageBlockId {
  const used = new Set(blocks.map(block => block.id))
  let index = blocks.length
  let id = createBlockId(prefix, index, suffix)
  while (used.has(id)) {
    index += 1
    id = createBlockId(prefix, index, suffix)
  }
  return id
}
