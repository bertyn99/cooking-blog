export type ContentBlockFieldInput =
  | 'text'
  | 'textarea'
  | 'number'
  | 'select'
  | 'toggle'
  | 'media'
  | 'color'

export type ContentBlockFieldKind = Exclude<ContentBlockFieldInput, 'textarea'>

export interface ContentBlockFieldKindMeta {
  kind: ContentBlockFieldKind
  label: string
  icon: string
}

export interface ContentBlockFieldOption {
  label: string
  value: string
}

/**
 * Studio-style prop schema: one field per Comark attribute.
 * `input` maps to Nuxt UI controls the way Content `property().editor({ input })` does.
 */
export interface ContentBlockField {
  key: string
  label: string
  description?: string
  input: ContentBlockFieldInput
  default?: string | number | boolean
  placeholder?: string
  options?: ContentBlockFieldOption[]
  min?: number
  max?: number
  /** Show the field only when sibling attrs match (e.g. category when source=category). */
  visibleWhen?: Record<string, string>
  /** Sibling field filled from the media library alt when this media is picked. */
  altKey?: string
}

/** Named Comark slots (`#title`, `#default`) shown as nested tree rows. */
export interface ContentBlockSlot {
  name: string
  label: string
  placeholder?: string
  input?: 'text' | 'textarea'
  /** Used when the stored slot is empty (Client fallback / new inserts). */
  default?: string
}

export function fieldsToAllowedProps(fields: ContentBlockField[]): string[] {
  return fields.map(field => field.key)
}

export function fieldsToDefaultProps(
  fields: ContentBlockField[],
): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {}
  for (const field of fields) {
    if (field.default === undefined) continue
    out[field.key] = field.default
  }
  return out
}

function fieldDefaultString(field: ContentBlockField): string {
  if (field.default === undefined || field.default === null) return ''
  return String(field.default)
}

/** Catalog defaults for empty/missing attrs (editor + Comark preview). */
export function resolveSectionProps(
  fields: ContentBlockField[],
  props: Record<string, string | number | boolean | undefined> = {},
): Record<string, string> {
  const out: Record<string, string> = {}
  for (const field of fields) {
    const raw = props[field.key]
    const trimmed = raw === undefined || raw === null ? '' : String(raw).trim()
    out[field.key] = trimmed || fieldDefaultString(field)
  }
  return out
}

export function isFieldVisible(
  field: ContentBlockField,
  values: Record<string, string | number | boolean | undefined>,
): boolean {
  if (!field.visibleWhen) return true
  return Object.entries(field.visibleWhen).every(([key, expected]) => {
    return String(values[key] ?? '') === expected
  })
}

export function propCountLabel(count: number): string {
  return count === 1 ? '1 prop' : `${count} props`
}

export function fieldInputKind(input: ContentBlockFieldInput): ContentBlockFieldKind {
  return input === 'textarea' ? 'text' : input
}

export function fieldKindMeta(kind: ContentBlockFieldKind): ContentBlockFieldKindMeta {
  switch (kind) {
    case 'text':
      return { kind, label: 'Texte', icon: 'i-lucide-type' }
    case 'number':
      return { kind, label: 'Nombre', icon: 'i-lucide-hash' }
    case 'select':
      return { kind, label: 'Liste', icon: 'i-lucide-list' }
    case 'toggle':
      return { kind, label: 'Booléen', icon: 'i-lucide-toggle-left' }
    case 'media':
      return { kind, label: 'Média', icon: 'i-lucide-image' }
    case 'color':
      return { kind, label: 'Couleur', icon: 'i-lucide-palette' }
    default: {
      const _exhaustive: never = kind
      return _exhaustive
    }
  }
}

export function visibleFields(
  fields: ContentBlockField[],
  values: Record<string, string | number | boolean | undefined> = {},
): ContentBlockField[] {
  return fields.filter(field => isFieldVisible(field, values))
}

export function uniqueFieldKinds(
  fields: ContentBlockField[],
): ContentBlockFieldKindMeta[] {
  const seen = new Set<ContentBlockFieldKind>()
  const out: ContentBlockFieldKindMeta[] = []
  for (const field of fields) {
    const kind = fieldInputKind(field.input)
    if (seen.has(kind)) continue
    seen.add(kind)
    out.push(fieldKindMeta(kind))
  }
  return out
}
