export const SECTION_BLOCK_TAGS = [
  'hero',
  'newsletter',
  'recipe-list',
  'article-list',
] as const

export type SectionBlockTag = (typeof SECTION_BLOCK_TAGS)[number]

export function isSectionBlockTag(tag: string): tag is SectionBlockTag {
  return (SECTION_BLOCK_TAGS as readonly string[]).includes(tag)
}

export const LIFTED_BLOCK_TAGS = [
  ...SECTION_BLOCK_TAGS,
  'grid',
  'callout',
  'image',
] as const

export type LiftedBlockTag = (typeof LIFTED_BLOCK_TAGS)[number]

export function isLiftedBlockTag(tag: string): tag is LiftedBlockTag {
  return (LIFTED_BLOCK_TAGS as readonly string[]).includes(tag)
}

export type ContentBlockFamily = 'section' | 'mdc' | 'native'

export type ContentBlockTag = LiftedBlockTag

export interface ContentBlockDefinition {
  tag: ContentBlockTag
  family: ContentBlockFamily
  label: string
  description: string
  icon: string
  insertable: boolean
  allowedProps: string[]
  defaultProps: Record<string, string | number | boolean>
}

export type PageBlockDefinition = ContentBlockDefinition

export const CONTENT_BLOCK_CATALOG: ContentBlockDefinition[] = [
  {
    tag: 'hero',
    family: 'section',
    label: 'Bannière',
    description: 'Grande image d’accroche.',
    icon: 'i-lucide-image',
    insertable: true,
    allowedProps: ['image'],
    defaultProps: { image: '/img/hero.jpg' },
  },
  {
    tag: 'newsletter',
    family: 'section',
    label: 'Newsletter',
    description: 'Bloc d’inscription à la newsletter.',
    icon: 'i-lucide-mail',
    insertable: true,
    allowedProps: [],
    defaultProps: {},
  },
  {
    tag: 'recipe-list',
    family: 'section',
    label: 'Liste de recettes',
    description: 'Dernières recettes ou sélection par catégorie.',
    icon: 'i-lucide-utensils',
    insertable: true,
    allowedProps: ['source', 'category', 'slugs', 'limit'],
    defaultProps: { source: 'latest', limit: '4' },
  },
  {
    tag: 'article-list',
    family: 'section',
    label: 'Liste d’articles',
    description: 'Derniers articles ou sélection par catégorie.',
    icon: 'i-lucide-newspaper',
    insertable: true,
    allowedProps: ['source', 'category', 'slugs', 'limit'],
    defaultProps: { source: 'latest', limit: '5' },
  },
  {
    tag: 'grid',
    family: 'mdc',
    label: 'Grille',
    description: 'Colonnes Comark (`::grid`).',
    icon: 'i-lucide-layout-grid',
    insertable: true,
    allowedProps: ['cols'],
    defaultProps: { cols: 2 },
  },
  {
    tag: 'callout',
    family: 'mdc',
    label: 'Encadré',
    description: 'Encadré info / astuce / attention (`::callout`).',
    icon: 'i-lucide-info',
    insertable: true,
    allowedProps: ['type'],
    defaultProps: { type: 'info' },
  },
  {
    tag: 'image',
    family: 'native',
    label: 'Image',
    description: 'Image markdown `![alt](src)`.',
    icon: 'i-lucide-image',
    insertable: true,
    allowedProps: ['src', 'alt', 'title'],
    defaultProps: { src: '/img/hero.jpg', alt: '' },
  },
]

export const PAGE_BLOCK_CATALOG: PageBlockDefinition[] = CONTENT_BLOCK_CATALOG.filter(
  item => item.insertable,
)

export function catalogEntryForTag(tag: LiftedBlockTag): ContentBlockDefinition {
  const entry = CONTENT_BLOCK_CATALOG.find(item => item.tag === tag)
  if (!entry) {
    throw new Error(`Unknown block tag: ${tag}`)
  }
  return entry
}

function pascalFromTag(tag: string): string {
  return tag
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
}

export function simpleComponentName(tag: string): string {
  return `Block${pascalFromTag(tag)}Simple`
}

export function editorComponentName(tag: string): string {
  return `Block${pascalFromTag(tag)}Editor`
}
