import { parseMarkdown } from 'comark'
import { renderMarkdown } from 'comark/render'
import type { MarkdownDocument } from 'comark'
import { catalogEntryForTag, isSectionBlockTag } from './catalog'
import { createBlockId, type PageBlock, type PageDocument, type ProseRegion, type SectionBlock } from './document'

type AstNode = MarkdownDocument['nodes'][number]

function isAstNode(value: unknown): value is AstNode {
  return Array.isArray(value) && typeof value[0] === 'string'
}

function attrsToProps(
  attrs: Record<string, unknown> | undefined,
  allowedProps: readonly string[],
): Record<string, string | number | boolean> {
  if (!attrs) return {}
  const allowed = new Set(allowedProps)
  const out: Record<string, string | number | boolean> = {}
  for (const [key, value] of Object.entries(attrs)) {
    if (!allowed.has(key)) continue
    if (value === true || value === false) {
      out[key] = value
    }
    else if (typeof value === 'number' || typeof value === 'string') {
      out[key] = value
    }
  }
  return out
}

async function nodesToMarkdown(nodes: AstNode[]): Promise<string> {
  if (nodes.length === 0) return ''
  return (await renderMarkdown({ nodes })).trim()
}

export async function parsePageContent(markdown: string): Promise<PageDocument> {
  const source = markdown.replace(/\r\n/g, '\n').trim()
  if (!source) {
    return { blocks: [] }
  }

  const tree = await parseMarkdown(source)
  const blocks: PageBlock[] = []
  let proseBuffer: AstNode[] = []
  let index = 0

  const flushProse = async () => {
    if (proseBuffer.length === 0) return
    const text = await nodesToMarkdown(proseBuffer)
    proseBuffer = []
    if (!text) return
    const region: ProseRegion = {
      id: createBlockId('prose', index++),
      kind: 'prose',
      markdown: text,
    }
    blocks.push(region)
  }

  for (const node of tree.nodes) {
    if (!isAstNode(node)) continue
    const tag = node[0]
    if (isSectionBlockTag(tag)) {
      await flushProse()
      const attrs = (node[1] ?? {}) as Record<string, unknown>
      const slotMarkdown = await extractSlotMarkdown(node)
      const def = catalogEntryForTag(tag)
      const section: SectionBlock = {
        id: createBlockId('section', index++, tag),
        kind: 'section',
        tag,
        props: attrsToProps(attrs, def.allowedProps),
        slots: slotMarkdown ? { default: slotMarkdown } : {},
      }
      blocks.push(section)
      continue
    }
    proseBuffer.push(node)
  }

  await flushProse()
  return { blocks }
}

async function extractSlotMarkdown(node: AstNode): Promise<string> {
  if (node.length <= 2) return ''
  const tail = node.slice(2)
  if (tail.length === 1 && typeof tail[0] === 'string') {
    return tail[0].trim()
  }
  const childNodes = tail.filter(isAstNode)
  if (childNodes.length === 0) return ''
  return nodesToMarkdown(childNodes)
}

export function assertPageDocument(doc: PageDocument): void {
  for (const block of doc.blocks) {
    if (block.kind === 'section') {
      if (!isSectionBlockTag(block.tag)) {
        throw new Error(`Invalid section tag: ${block.tag}`)
      }
    }
    else if (!block.markdown.trim()) {
      throw new Error('Empty prose region is not allowed')
    }
  }
}
