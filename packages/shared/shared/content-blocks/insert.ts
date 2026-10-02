import type { LiftedBlockTag } from './catalog'
import { catalogEntryForTag } from './catalog'
import { serializeMarkdownImage } from '../content-image'

function serializeInlineProps(props: Record<string, string | number | boolean>): string {
  const parts: string[] = []
  for (const [key, value] of Object.entries(props)) {
    if (value === '' || value == null) continue
    parts.push(`${key}="${String(value)}"`)
  }
  return parts.join(' ')
}

export function defaultSectionMarkdown(tag: LiftedBlockTag): string {
  const def = catalogEntryForTag(tag)
  if (tag === 'image') {
    return serializeMarkdownImage({
      alt: String(def.defaultProps.alt ?? ''),
      src: String(def.defaultProps.src ?? ''),
      title: def.defaultProps.title == null ? null : String(def.defaultProps.title),
    })
  }
  const attrs = serializeInlineProps(
    Object.fromEntries(
      Object.entries(def.defaultProps).map(([k, v]) => [k, v]),
    ),
  )
  const open = attrs ? `::${tag}{${attrs}}` : `::${tag}`
  if (tag === 'grid') {
    return `${open}\n\nColonne\n\n::`
  }
  if (tag === 'callout') {
    return `${open}\n\nTexte de l’encadré.\n\n::`
  }
  return `${open}\n::`
}
