import type { LiftedBlockTag } from './catalog'
import { catalogEntryForTag } from './catalog'
import { serializeMarkdownImage } from '../content-image'
import { DEFAULT_FAQ_ITEMS_JSON } from './faq'

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
      Object.entries(def.defaultProps).filter(([key, value]) => {
        const field = def.fields.find(item => item.key === key)
        if (field?.omitDefault && field.default !== undefined && String(value) === String(field.default)) {
          return false
        }
        return true
      }),
    ),
  )
  const open = attrs ? `::${tag}{${attrs}}` : `::${tag}`
  if (tag === 'grid') {
    return `${open}\n\nColonne\n\n::`
  }
  if (tag === 'callout') {
    return `${open}\n\nTexte de l’encadré.\n\n::`
  }
  if (tag === 'faq') {
    const items = String(def.defaultProps.items ?? DEFAULT_FAQ_ITEMS_JSON)
    const title = def.slots.find(slot => slot.name === 'title')?.default ?? 'Questions fréquentes'
    return `::faq{items='${items}'}\n#title\n${title}\n::`
  }
  return `${open}\n::`
}
