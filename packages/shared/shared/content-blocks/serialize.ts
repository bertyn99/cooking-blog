import { catalogEntryForTag } from './catalog'
import { parsePageContent } from './parse'
import type { ContentBlockDefinition } from './catalog'
import type { PageDocument, SectionBlock } from './document'
import { serializeMarkdownImage } from '../content-image'

function serializeAttrValue(value: string | number | boolean): string {
  return String(value)
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\r\n/g, '\\n')
    .replace(/[\r\n]/g, '\\n')
    .replace(/}/g, '\\}')
}

function serializeProps(block: SectionBlock, def: ContentBlockDefinition): string {
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
  if (block.tag === 'image') {
    return serializeMarkdownImage({
      alt: String(block.props.alt ?? ''),
      src: String(block.props.src ?? ''),
      title: block.props.title == null ? null : String(block.props.title),
    })
  }
  const def = catalogEntryForTag(block.tag)
  const attrs = serializeProps(block, def)
  const open = attrs ? `::${block.tag}{${attrs}}` : `::${block.tag}`
  const slotNames = Object.keys(block.slots).filter(name => block.slots[name]?.trim())
  if (slotNames.length === 0) {
    return `${open}\n::`
  }
  const namedOnly = slotNames.filter(name => name !== 'default')
  if (namedOnly.length === 0) {
    return `${open}\n${block.slots.default!.trim()}\n::`
  }
  const ordered = [
    ...def.slots.map(slot => slot.name),
    ...slotNames.filter(name => !def.slots.some(slot => slot.name === name)),
  ]
  const seen = new Set<string>()
  const chunks: string[] = [open]
  for (const name of ordered) {
    if (seen.has(name)) continue
    seen.add(name)
    const markdown = block.slots[name]?.trim()
    if (!markdown) continue
    chunks.push(`#${name}`, markdown)
  }
  chunks.push('::')
  return chunks.join('\n')
}

export async function serializePageDocument(doc: PageDocument): Promise<string> {
  const chunks: string[] = []

  for (const block of doc.blocks) {
    switch (block.kind) {
      case 'section':
        chunks.push(serializeSectionBlock(block))
        break
      case 'prose':
        chunks.push(block.markdown.trim())
        break
      default: {
        const _never: never = block
        throw new Error(`Unknown page block: ${JSON.stringify(_never)}`)
      }
    }
  }

  return chunks.filter(Boolean).join('\n\n').trim()
}

export async function pageContentRoundTrip(markdown: string): Promise<string> {
  const doc = await parsePageContent(markdown)
  return serializePageDocument(doc)
}
