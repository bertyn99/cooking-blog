/**
 * TipTap markdown helpers for Comark/MDC containers:
 *   ::name{attr="value"}
 *   body…
 *   ::
 *
 * TipTap's built-in `createBlockMarkdownSpec` uses Pandoc `:::name` fences;
 * Strapi content on this site uses MDC-style double-colon blocks.
 */

export type MdcContainerMarkdownOptions = {
  nodeName: string
  /** Markdown tag name; defaults to nodeName. */
  name?: string
  defaultAttributes?: Record<string, unknown>
  allowedAttributes?: string[]
  content?: 'block' | 'inline'
}

/** Parse `type="tip" cols=2` (quoted or bare values). */
export function parseMdcAttributes(attrString: string): Record<string, string | boolean> {
  if (!attrString?.trim()) return {}

  const attributes: Record<string, string | boolean> = {}
  const kvRegex = /([a-zA-Z][\w-]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s}]+))/g

  for (const match of attrString.matchAll(kvRegex)) {
    const key = match[1]!
    attributes[key] = match[2] ?? match[3] ?? match[4] ?? true
  }

  return attributes
}

export function serializeMdcAttributes(attributes: Record<string, unknown> | undefined): string {
  if (!attributes) return ''
  const parts: string[] = []
  for (const [key, value] of Object.entries(attributes)) {
    if (value === true) {
      parts.push(key)
    }
    else if (value !== false && value != null && value !== '') {
      parts.push(`${key}="${String(value)}"`)
    }
  }
  return parts.join(' ')
}

/**
 * Returns TipTap extension markdown fields (`parseMarkdown`, `markdownTokenizer`, `renderMarkdown`).
 */
export function createMdcContainerMarkdownSpec(options: MdcContainerMarkdownOptions) {
  const {
    nodeName,
    name: markdownName,
    defaultAttributes = {},
    allowedAttributes,
    content = 'block',
  } = options
  const blockName = markdownName || nodeName

  const filterAttributes = (attrs: Record<string, unknown>) => {
    if (!allowedAttributes) return attrs
    const filtered: Record<string, unknown> = {}
    for (const key of allowedAttributes) {
      if (key in attrs) filtered[key] = attrs[key]
    }
    return filtered
  }

  return {
    parseMarkdown: (token: {
      attributes?: Record<string, unknown>
      tokens?: unknown[]
      content?: string
    }, h: {
      parseChildren: (tokens: unknown[]) => unknown
      parseInline: (tokens: unknown[]) => unknown
      createNode: (type: string, attrs: Record<string, unknown>, content: unknown) => unknown
    }) => {
      const nodeContent = content === 'block'
        ? h.parseChildren(token.tokens || [])
        : h.parseInline(token.tokens || [])
      const attrs = { ...defaultAttributes, ...token.attributes }
      return h.createNode(nodeName, attrs, nodeContent)
    },

    markdownTokenizer: {
      name: nodeName,
      level: 'block' as const,
      start(src: string) {
        const regex = new RegExp(`^::${blockName}(?:\\{|\\s|$)`, 'm')
        const index = src.match(regex)?.index
        return index !== undefined ? index : -1
      },
      tokenize(src: string, _tokens: unknown[], lexer: {
        blockTokens: (src: string) => Array<Record<string, unknown>>
        inlineTokens: (src: string) => unknown[]
      }) {
        const openingRegex = new RegExp(`^::${blockName}(?:\\{([^}]*)\\})?\\s*\\n`)
        const openingMatch = src.match(openingRegex)
        if (!openingMatch) return undefined

        const [openingTag, attrString = ''] = openingMatch
        const attributes = {
          ...defaultAttributes,
          ...parseMdcAttributes(attrString),
        }

        let level = 1
        const position = openingTag.length
        const remaining = src.slice(position)
        // Opening `::Name…` or closing bare `::`
        const blockPattern = /^::([\w-]*)(\{[^}]*\})?\s*$/gm

        for (; ;) {
          const match = blockPattern.exec(remaining)
          if (match === null) break

          const matchPos = match.index
          const nestedName = match[1]

          if (nestedName) {
            level += 1
          }
          else {
            level -= 1
            if (level === 0) {
              const rawContent = remaining.slice(0, matchPos)
              const matchedContent = rawContent.trim()
              const fullMatch = src.slice(0, position + matchPos + match[0].length)

              let contentTokens: unknown[] = []
              if (matchedContent) {
                if (content === 'block') {
                  contentTokens = lexer.blockTokens(rawContent)
                  contentTokens.forEach((token) => {
                    const t = token as { text?: string, tokens?: unknown[] }
                    if (t.text && (!t.tokens || t.tokens.length === 0)) {
                      t.tokens = lexer.inlineTokens(t.text)
                    }
                  })
                  while (contentTokens.length > 0) {
                    const lastToken = contentTokens[contentTokens.length - 1] as {
                      type?: string
                      text?: string
                    }
                    if (lastToken.type === 'paragraph' && (!lastToken.text || lastToken.text.trim() === '')) {
                      contentTokens.pop()
                    }
                    else {
                      break
                    }
                  }
                }
                else {
                  contentTokens = lexer.inlineTokens(matchedContent)
                }
              }

              return {
                type: nodeName,
                raw: fullMatch,
                attributes,
                content: matchedContent,
                tokens: contentTokens,
              }
            }
          }
        }

        return undefined
      },
    },

    renderMarkdown: (node: { attrs?: Record<string, unknown>, content?: unknown[] }, h: {
      renderChildren: (content: unknown[], separator?: string) => string
    }) => {
      const filteredAttrs = filterAttributes(node.attrs || {})
      const attrs = serializeMdcAttributes(filteredAttrs)
      const attrString = attrs ? `{${attrs}}` : ''
      const renderedContent = h.renderChildren(node.content || [], '\n\n')
      return `::${blockName}${attrString}\n\n${renderedContent}\n\n::`
    },
  }
}
