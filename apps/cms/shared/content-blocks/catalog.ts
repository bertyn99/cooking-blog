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

export interface BlockFieldOption {
  label: string
  value: string
}

export interface PageBlockDefinition {
  tag: SectionBlockTag
  label: string
  description: string
  icon: string
  insertable: boolean
  allowedProps: string[]
  defaultProps: Record<string, string | number | boolean>
}

export const PAGE_BLOCK_CATALOG: PageBlockDefinition[] = [
  {
    tag: 'hero',
    label: 'Bannière',
    description: 'Grande image d’accroche avec carrousel.',
    icon: 'i-lucide-image',
    insertable: true,
    allowedProps: ['image'],
    defaultProps: { image: '/img/hero.jpg' },
  },
  {
    tag: 'newsletter',
    label: 'Newsletter',
    description: 'Bloc d’inscription à la newsletter.',
    icon: 'i-lucide-mail',
    insertable: true,
    allowedProps: [],
    defaultProps: {},
  },
  {
    tag: 'recipe-list',
    label: 'Liste de recettes',
    description: 'Dernières recettes ou sélection par catégorie.',
    icon: 'i-lucide-utensils',
    insertable: true,
    allowedProps: ['source', 'category', 'slugs', 'limit'],
    defaultProps: { source: 'latest', limit: '4' },
  },
  {
    tag: 'article-list',
    label: 'Liste d’articles',
    description: 'Derniers articles ou sélection par catégorie.',
    icon: 'i-lucide-newspaper',
    insertable: true,
    allowedProps: ['source', 'category', 'slugs', 'limit'],
    defaultProps: { source: 'latest', limit: '5' },
  },
]

export function catalogEntryForTag(tag: SectionBlockTag): PageBlockDefinition {
  const entry = PAGE_BLOCK_CATALOG.find(item => item.tag === tag)
  if (!entry) {
    throw new Error(`Unknown section block tag: ${tag}`)
  }
  return entry
}
