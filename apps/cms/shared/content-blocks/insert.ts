import type { SectionBlockTag } from './catalog'
import { catalogEntryForTag } from './catalog'

function serializeInlineProps(props: Record<string, string | number | boolean>): string {
  const parts: string[] = []
  for (const [key, value] of Object.entries(props)) {
    if (value === '' || value == null) continue
    parts.push(`${key}="${String(value)}"`)
  }
  return parts.join(' ')
}

export function defaultSectionMarkdown(tag: SectionBlockTag): string {
  const def = catalogEntryForTag(tag)
  const attrs = serializeInlineProps(
    Object.fromEntries(
      Object.entries(def.defaultProps).map(([k, v]) => [k, v]),
    ),
  )
  const open = attrs ? `::${tag}{${attrs}}` : `::${tag}`
  return `${open}\n::`
}
