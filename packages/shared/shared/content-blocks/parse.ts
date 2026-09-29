import { parseMarkdown } from 'comark'
import { renderMarkdown } from 'comark/render'
import type { MarkdownDocument } from 'comark'
import { catalogEntryForTag, isLiftedBlockTag, type LiftedBlockTag } from './catalog'
import { createBlockId, type PageBlock, type PageDocument, type ProseRegion, type SectionBlock } from './document'

type AstNode = MarkdownDocument['nodes'][number]

function isAstNode(value: unknown): value is AstNode {
  return Array.isArray(value) && typeof value[0] === 'string'
}

function isAttrRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function nodeAttrs(node: AstNode): Record<string, unknown> {
  const attrs = node[1]
  return isAttrRecord(attrs) ? attrs : {}
}

function attrsToProps(
  attrs: Record<string, unknown>,
  allowedProps: readonly string[],
): Record<string, string | number | boolean> {
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

function unwrapSoleImage(node: AstNode): AstNode {
  if (node[0] !== 'p') return node
  const children = node.slice(2).filter(child => {
    if (typeof child === 'string') return child.trim().length > 0
    return isAstNode(child)
  })
  if (children.length === 1 && isAstNode(children[0]) && children[0][0] === 'img') {
    return children[0]
  }
  return node
}

async function nodesToMarkdown(nodes: AstNode[]): Promise<string> {
  if (nodes.length === 0) return ''
  return (await renderMarkdown({ nodes })).trim()
}

function liftedTagForAst(tag: string): LiftedBlockTag | null {
  if (isLiftedBlockTag(tag)) return tag
  if (tag === 'img') return 'image'
  return null
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
    const current = unwrapSoleImage(node)
    const tag = current[0]
    const lifted = liftedTagForAst(tag)
    if (lifted) {
      await flushProse()
      const def = catalogEntryForTag(lifted)
      const section: SectionBlock = {
        id: createBlockId('section', index++, lifted),
        kind: 'section',
        tag: lifted,
        props: attrsToProps(nodeAttrs(current), def.allowedProps),
        slots: {},
      }
      if (lifted !== 'image') {
        const slotMarkdown = await extractSlotMarkdown(current)
        if (slotMarkdown) section.slots.default = slotMarkdown
      }
      blocks.push(section)
      continue
    }
    proseBuffer.push(current)
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
    switch (block.kind) {
      case 'section':
        if (!isLiftedBlockTag(block.tag)) {
          throw new Error(`Invalid section tag: ${block.tag}`)
        }
        break
      case 'prose':
        if (!block.markdown.trim()) {
          throw new Error('Empty prose region is not allowed')
        }
        break
      default: {
        const _never: never = block
        throw new Error(`Unknown page block: ${JSON.stringify(_never)}`)
      }
    }
  }
}
