type StrapiZoneBlock = {
  __component: string
  [key: string]: unknown
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function blockToMarkdown(block: StrapiZoneBlock): string {
  switch (block.__component) {
    case 'ui.text':
      return asString(block.content).trim()

    case 'ui.divider':
      return '\n---\n'

    case 'ui.image': {
      const url = asString(block.url) || asString(block.src)
      const alt = asString(block.alt) || asString(block.alternativeText)
      return url ? `\n![${alt}](${url})\n` : ''
    }

    case 'ui.quote': {
      const body = asString(block.content) || asString(block.text)
      const author = asString(block.author)
      const quoted = body.split('\n').map(line => `> ${line}`).join('\n')
      return author ? `${quoted}\n>\n> — ${author}` : quoted
    }

    case 'ui.code-block': {
      const code = asString(block.code) || asString(block.content)
      const lang = asString(block.language) || ''
      return `\n\`\`\`${lang}\n${code}\n\`\`\`\n`
    }

    case 'ui.banner':
    case 'ui.card': {
      const title = asString(block.title)
      const content = asString(block.content) || asString(block.text)
      if (title && content) return `## ${title}\n\n${content}`
      return title || content
    }

    case 'ui.button': {
      const label = asString(block.label) || asString(block.text) || 'Lien'
      const url = asString(block.url) || asString(block.href)
      return url ? `[${label}](${url})` : label
    }

    case 'ui.gallery': {
      const images = Array.isArray(block.images) ? block.images : []
      return images
        .map((img) => {
          if (!img || typeof img !== 'object') return ''
          const record = img as Record<string, unknown>
          const url = asString(record.url)
          const alt = asString(record.alternativeText)
          return url ? `![${alt}](${url})` : ''
        })
        .filter(Boolean)
        .join('\n\n')
    }

    case 'ui.grid': {
      const items = Array.isArray(block.items) ? block.items : []
      return items
        .map((item) => {
          if (!item || typeof item !== 'object') return ''
          const record = item as Record<string, unknown>
          const title = asString(record.title)
          const content = asString(record.content) || asString(record.text)
          if (title && content) return `### ${title}\n\n${content}`
          return title || content
        })
        .filter(Boolean)
        .join('\n\n')
    }

    case 'ui.video': {
      const url = asString(block.url) || asString(block.embedUrl)
      return url ? `\n[Vidéo](${url})\n` : ''
    }

    default:
      return ''
  }
}

export function strapiZonesToMarkdown(blocks: unknown): string {
  if (typeof blocks === 'string') return blocks
  if (!Array.isArray(blocks)) return ''

  return blocks
    .map(block => blockToMarkdown(block as StrapiZoneBlock))
    .filter(part => part.trim().length > 0)
    .join('\n\n')
    .trim()
}
