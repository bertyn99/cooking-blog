import { describe, expect, it } from 'vitest'
import {
  createMdcContainerMarkdownSpec,
  parseMdcAttributes,
  serializeMdcAttributes,
} from '../../app/utils/editor-mdc-container'
import {
  clampGridCols,
  packBlocksIntoColumns,
  zipColumnsToBlocks,
} from '../../app/utils/editor-grid-columns'
import {
  isEmptyParagraphJson,
  parseGridMarkdownToken,
  renderGridMarkdownNode,
} from '../../app/utils/editor-grid-markdown'
import { extractOrphanPublicImagePaths } from '../../server/services/extract/content-media'

describe('parseMdcAttributes', () => {
  it('parses quoted and bare values', () => {
    expect(parseMdcAttributes('type="tip"')).toEqual({ type: 'tip' })
    expect(parseMdcAttributes('cols=2')).toEqual({ cols: '2' })
    expect(parseMdcAttributes('type="info" cols=3')).toEqual({ type: 'info', cols: '3' })
  })
})

describe('serializeMdcAttributes', () => {
  it('serializes key/value pairs', () => {
    expect(serializeMdcAttributes({ type: 'tip', cols: 2 })).toBe('type="tip" cols="2"')
  })
})

describe('grid column packing', () => {
  it('packs and zips round-trip in row-major order', () => {
    const blocks = ['a', 'b', 'c', 'd']
    const cols = packBlocksIntoColumns(blocks, 2)
    expect(cols).toEqual([['a', 'c'], ['b', 'd']])
    expect(zipColumnsToBlocks(cols)).toEqual(blocks)
  })

  it('clamps column counts', () => {
    expect(clampGridCols(0)).toBe(1)
    expect(clampGridCols(9)).toBe(4)
    expect(clampGridCols('2')).toBe(2)
  })
})

describe('grid markdown round-trip helpers', () => {
  function createNode(type: string, attrs: Record<string, unknown>, content: unknown) {
    return { type, attrs, content }
  }

  it('parses flat children into gridColumn stacks', () => {
    const parsed = parseGridMarkdownToken(
      {
        attributes: { cols: 2 },
        tokens: [{ id: 'p' }, { id: 'img' }],
      },
      {
        parseChildren: tokens => tokens,
        createNode,
      },
    ) as {
      type: string
      attrs: { cols: number }
      content: Array<{ type: string, content: unknown[] }>
    }

    expect(parsed.type).toBe('grid')
    expect(parsed.attrs.cols).toBe(2)
    expect(parsed.content).toHaveLength(2)
    expect(parsed.content[0]?.type).toBe('gridColumn')
    expect(parsed.content[0]?.content).toEqual([{ id: 'p' }])
    expect(parsed.content[1]?.content).toEqual([{ id: 'img' }])
  })

  it('pads missing columns with empty paragraphs', () => {
    const parsed = parseGridMarkdownToken(
      { attributes: { cols: 3 }, tokens: [{ id: 'only' }] },
      {
        parseChildren: tokens => tokens,
        createNode,
      },
    ) as { content: Array<{ content: unknown[] }> }

    expect(parsed.content).toHaveLength(3)
    expect(parsed.content[0]?.content).toEqual([{ id: 'only' }])
    expect(parsed.content[1]?.content).toEqual([{ type: 'paragraph', attrs: {}, content: [] }])
    expect(parsed.content[2]?.content).toEqual([{ type: 'paragraph', attrs: {}, content: [] }])
  })

  it('renders column stacks back to flat MDC grid fence', () => {
    const md = renderGridMarkdownNode(
      {
        attrs: { cols: 2 },
        content: [
          {
            content: [{
              type: 'paragraph',
              content: [{ type: 'text', text: 'left' }],
            }],
          },
          {
            content: [{
              type: 'paragraph',
              content: [{ type: 'text', text: 'right' }],
            }],
          },
        ],
      },
      {
        renderChildren: (nodes) =>
          (nodes as Array<{ content?: Array<{ text?: string }> }>)
            .map(n => n.content?.[0]?.text ?? '')
            .join('\n\n'),
      },
    )
    expect(md).toBe('::grid{cols="2"}\n\nleft\n\nright\n\n::')
  })

  it('omits lone empty paragraphs when flattening columns', () => {
    const md = renderGridMarkdownNode(
      {
        attrs: { cols: 2 },
        content: [
          { content: [{ type: 'paragraph', content: [{ type: 'text', text: 'only' }] }] },
          { content: [{ type: 'paragraph', content: [] }] },
        ],
      },
      {
        renderChildren: (nodes) =>
          (nodes as Array<{ content?: Array<{ text?: string }> }>)
            .map(n => n.content?.[0]?.text ?? 'EMPTY')
            .join('|'),
      },
    )
    expect(md).toBe('::grid{cols="2"}\n\nonly\n\n::')
  })

  it('detects empty paragraph json', () => {
    expect(isEmptyParagraphJson({ type: 'paragraph', content: [] })).toBe(true)
    expect(isEmptyParagraphJson({ type: 'paragraph', content: [{ type: 'text' }] })).toBe(false)
  })
})

describe('createMdcContainerMarkdownSpec', () => {
  it('tokenizes ::callout and ::grid fences', () => {
    const callout = createMdcContainerMarkdownSpec({ nodeName: 'callout' })
    const src = `::callout{type="tip"}\n\nHello tip\n\n::\n`
    const token = callout.markdownTokenizer.tokenize(src, [], {
      blockTokens: text => [{ type: 'paragraph', text: text.trim(), tokens: [] }],
      inlineTokens: () => [],
    })
    expect(token?.type).toBe('callout')
    expect(token?.attributes).toMatchObject({ type: 'tip' })
    expect(token?.content).toContain('Hello tip')
  })

  it('renders MDC fences without space before attrs', () => {
    const grid = createMdcContainerMarkdownSpec({
      nodeName: 'grid',
      allowedAttributes: ['cols'],
      defaultAttributes: { cols: 2 },
    })
    const md = grid.renderMarkdown(
      { attrs: { cols: 2 }, content: [{ type: 'paragraph' }] },
      { renderChildren: () => 'Body' },
    )
    expect(md).toBe('::grid{cols="2"}\n\nBody\n\n::')
  })
})

describe('extractOrphanPublicImagePaths', () => {
  it('finds /images/… that are not /images/uploads/', () => {
    const text = `
![ok](/images/uploads/a.webp)
![bad](/images/aperitif-portugais/caldo-verde.jpg)
![also](https://example.com/images/foo/bar.png)
`
    expect(extractOrphanPublicImagePaths(text)).toEqual([
      '/images/aperitif-portugais/caldo-verde.jpg',
      '/images/foo/bar.png',
    ])
  })
})
