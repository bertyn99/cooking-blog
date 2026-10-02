import {
  fieldsToAllowedProps,
  fieldsToDefaultProps,
  type ContentBlockField,
  type ContentBlockSlot,
} from './schema'

export const SECTION_BLOCK_TAGS = [
  'hero',
  'person',
  'hubs',
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

export type ContentBlockSimpleChromeProps = {
  expanded?: boolean
  values?: Record<string, string | number | boolean | undefined>
  slotValues?: Record<string, string>
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
  fields: ContentBlockField[]
  slots: ContentBlockSlot[]
  allowedProps: string[]
  defaultProps: Record<string, string | number | boolean>
}

export type PageBlockDefinition = ContentBlockDefinition

const LIST_SOURCE_OPTIONS = [
  { label: 'Derniers', value: 'latest' },
  { label: 'Catégorie', value: 'category' },
  { label: 'Slugs', value: 'slugs' },
] as const

function defineBlock(
  def: Omit<ContentBlockDefinition, 'allowedProps' | 'defaultProps'>,
): ContentBlockDefinition {
  return {
    ...def,
    allowedProps: fieldsToAllowedProps(def.fields),
    defaultProps: fieldsToDefaultProps(def.fields),
  }
}

export const CONTENT_BLOCK_CATALOG: ContentBlockDefinition[] = [
  defineBlock({
    tag: 'hero',
    family: 'section',
    label: 'Bannière',
    description: 'Grande image d’accroche.',
    icon: 'i-lucide-image',
    insertable: true,
    fields: [
      {
        key: 'image',
        label: 'Image',
        input: 'media',
        default: '/img/hero.jpg',
        placeholder: '/img/hero.jpg',
        altKey: 'alt',
      },
      {
        key: 'alt',
        label: 'Texte alternatif',
        input: 'text',
        placeholder: 'Décrivez l’image',
      },
      {
        key: 'ctaHref',
        label: 'Lien du bouton',
        input: 'text',
        default: '/recette',
        placeholder: '/recette',
      },
      {
        key: 'ctaSecondaryHref',
        label: 'Lien du second bouton',
        input: 'text',
        default: '/blog',
        placeholder: '/blog',
      },
    ],
    slots: [
      { name: 'title', label: 'TITLE', input: 'text', placeholder: 'Titre' },
      { name: 'description', label: 'DESCRIPTION', input: 'textarea', placeholder: 'Accroche' },
      { name: 'cta', label: 'CTA', input: 'text', placeholder: 'Libellé du bouton' },
      { name: 'cta-secondary', label: 'CTA SECONDARY', input: 'text', placeholder: 'Second bouton' },
    ],
  }),
  defineBlock({
    tag: 'person',
    family: 'section',
    label: 'Présentation',
    description: 'Intro auteur : photo, texte et lien (un seul H2).',
    icon: 'i-lucide-user',
    insertable: true,
    fields: [
      {
        key: 'image',
        label: 'Portrait',
        input: 'media',
        default: '/img/author.jpg',
        placeholder: '/img/author.jpg',
        altKey: 'alt',
      },
      {
        key: 'alt',
        label: 'Texte alternatif',
        input: 'text',
        default: 'Portrait du cuistot',
        placeholder: 'Décrivez le portrait',
      },
      {
        key: 'href',
        label: 'Lien',
        input: 'text',
        default: '/a-propos',
        placeholder: '/a-propos',
      },
    ],
    slots: [
      { name: 'heading', label: 'HEADING', input: 'text', placeholder: 'Titre de section' },
      { name: 'body', label: 'BODY', input: 'textarea', placeholder: 'Texte d’intro' },
      { name: 'cta', label: 'CTA', input: 'text', placeholder: 'Libellé du lien' },
    ],
  }),
  defineBlock({
    tag: 'hubs',
    family: 'section',
    label: 'Hubs',
    description: 'Quatre portes d’entrée : recettes, techniques, Afrique, journal.',
    icon: 'i-lucide-layout-grid',
    insertable: true,
    fields: [
      {
        key: 'recipesHref',
        label: 'Lien recettes',
        input: 'text',
        default: '/recette',
      },
      {
        key: 'techniquesHref',
        label: 'Lien techniques',
        input: 'text',
        default: '/techniques-culinaires',
      },
      {
        key: 'africaHref',
        label: 'Lien Afrique',
        input: 'text',
        default: '/recettes-du-monde',
      },
      {
        key: 'journalHref',
        label: 'Lien journal',
        input: 'text',
        default: '/blog',
      },
    ],
    slots: [
      { name: 'title', label: 'TITLE', input: 'text', default: 'Explorer le journal', placeholder: 'Titre' },
    ],
  }),
  defineBlock({
    tag: 'newsletter',
    family: 'section',
    label: 'Newsletter',
    description: 'Bloc d’inscription. Titre, texte et bouton se règlent dans les slots.',
    icon: 'i-lucide-mail',
    insertable: true,
    fields: [],
    slots: [
      {
        name: 'title',
        label: 'TITLE',
        input: 'text',
        default: 'Tu veux recevoir les dernières recettes ?',
        placeholder: 'Titre',
      },
      {
        name: 'subtitle',
        label: 'SUBTITLE',
        input: 'textarea',
        default: 'Inscris-toi à notre newsletter pour ne rien rater !',
        placeholder: 'Sous-titre',
      },
      {
        name: 'button',
        label: 'BUTTON',
        input: 'text',
        default: 'Inscrire-toi',
        placeholder: 'Bouton',
      },
    ],
  }),
  defineBlock({
    tag: 'recipe-list',
    family: 'section',
    label: 'Liste de recettes',
    description: 'Dernières recettes ou sélection par catégorie.',
    icon: 'i-lucide-utensils',
    insertable: true,
    fields: [
      {
        key: 'source',
        label: 'Source',
        input: 'select',
        default: 'latest',
        options: [...LIST_SOURCE_OPTIONS],
      },
      {
        key: 'category',
        label: 'Catégorie',
        input: 'text',
        placeholder: 'slug',
        visibleWhen: { source: 'category' },
      },
      {
        key: 'slugs',
        label: 'Slugs',
        input: 'text',
        placeholder: 'slug-1, slug-2',
        visibleWhen: { source: 'slugs' },
      },
      {
        key: 'limit',
        label: 'Nombre',
        input: 'number',
        default: '4',
        min: 1,
        max: 24,
      },
    ],
    slots: [
      { name: 'title', label: 'TITLE', input: 'text', placeholder: 'Titre de la liste' },
    ],
  }),
  defineBlock({
    tag: 'article-list',
    family: 'section',
    label: 'Liste d’articles',
    description: 'Derniers articles ou sélection par catégorie.',
    icon: 'i-lucide-newspaper',
    insertable: true,
    fields: [
      {
        key: 'source',
        label: 'Source',
        input: 'select',
        default: 'latest',
        options: [...LIST_SOURCE_OPTIONS],
      },
      {
        key: 'category',
        label: 'Catégorie',
        input: 'text',
        placeholder: 'slug',
        visibleWhen: { source: 'category' },
      },
      {
        key: 'slugs',
        label: 'Slugs',
        input: 'text',
        placeholder: 'slug-1, slug-2',
        visibleWhen: { source: 'slugs' },
      },
      {
        key: 'limit',
        label: 'Nombre',
        input: 'number',
        default: '5',
        min: 1,
        max: 24,
      },
    ],
    slots: [
      {
        name: 'title',
        label: 'TITLE',
        input: 'text',
        default: 'Derniers articles',
        placeholder: 'Titre de la liste',
      },
    ],
  }),
  defineBlock({
    tag: 'grid',
    family: 'mdc',
    label: 'Grille',
    description: 'Colonnes Comark (`::grid`).',
    icon: 'i-lucide-layout-grid',
    insertable: true,
    fields: [
      {
        key: 'cols',
        label: 'Colonnes',
        input: 'select',
        default: 2,
        options: [
          { label: '1', value: '1' },
          { label: '2', value: '2' },
          { label: '3', value: '3' },
          { label: '4', value: '4' },
        ],
      },
    ],
    slots: [{ name: 'default', label: 'DEFAULT', input: 'textarea', placeholder: 'Contenu de la grille' }],
  }),
  defineBlock({
    tag: 'callout',
    family: 'mdc',
    label: 'Encadré',
    description: 'Encadré info / astuce / attention (`::callout`).',
    icon: 'i-lucide-info',
    insertable: true,
    fields: [
      {
        key: 'type',
        label: 'Type',
        input: 'select',
        default: 'info',
        options: [
          { label: 'Info', value: 'info' },
          { label: 'Astuce', value: 'tip' },
          { label: 'Attention', value: 'warning' },
        ],
      },
    ],
    slots: [{ name: 'default', label: 'DEFAULT', input: 'textarea', placeholder: 'Texte de l’encadré' }],
  }),
  defineBlock({
    tag: 'image',
    family: 'native',
    label: 'Image',
    description: 'Image markdown `![alt](src)`.',
    icon: 'i-lucide-image',
    insertable: true,
    fields: [
      {
        key: 'src',
        label: 'Source',
        input: 'media',
        default: '/img/hero.jpg',
        placeholder: '/img/hero.jpg',
        altKey: 'alt',
      },
      {
        key: 'alt',
        label: 'Texte alternatif',
        input: 'text',
        default: '',
      },
      {
        key: 'title',
        label: 'Titre',
        input: 'text',
        placeholder: '4:3',
      },
    ],
    slots: [],
  }),
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
