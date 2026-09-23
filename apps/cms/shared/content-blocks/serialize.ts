import { renderMarkdown } from 'comark/render'
import { parseMarkdown } from 'comark'
import type { PageBlockDefinition } from './catalog'
import { catalogEntryForTag } from './catalog'
import type { PageDocument, SectionBlock } from './document'

function serializeAttrValue(value: string | number | boolean): string {
  return String(value)
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\r\n/g, '\\n')
    .replace(/[\r\n]/g, '\\n')
    .replace(/}/g, '\\}')
}

function serializeProps(block: SectionBlock, def: PageBlockDefinition): string {
  const parts: string[] = []
  for (const key of def.allowedProps) {
    const value = block.props[key]
    if (value === undefined || value === null || value === '') continue
    if (value === true) {
      parts.push(key)
    }
    else {
      parts.push(`${key}="${serializeAttrValue(value)}"`)
    }
  }
  return parts.join(' ')
}

function serializeSectionBlock(block: SectionBlock): string {
  const def = catalogEntryForTag(block.tag)
  const attrs = serializeProps(block, def)
  const open = attrs ? `::${block.tag}{${attrs}}` : `::${block.tag}`
  const defaultSlot = block.slots.default?.trim()
  if (defaultSlot) {
    return `${open}\n${defaultSlot}\n::`
  }
  return `${open}\n::`
}

export async function serializePageDocument(doc: PageDocument): Promise<string> {
  const chunks: string[] = []

  for (const block of doc.blocks) {
    if (block.kind === 'section') {
      chunks.push(serializeSectionBlock(block))
    }
    else {
      chunks.push(block.markdown.trim())
    }
  }

  return chunks.filter(Boolean).join('\n\n').trim()
}

/** Round-trip helper for tests. */
export async function pageContentRoundTrip(markdown: string): Promise<string> {
  const { parsePageContent } = await import('./parse')
  const doc = await parsePageContent(markdown)
  return serializePageDocument(doc)
}

export async function proseRegionFromMarkdown(markdown: string): Promise<string> {
  const tree = await parseMarkdown(markdown)
  return renderMarkdown(tree)
}
