export const GLOSSARY_ICON_KEYS = [
  'pan',
  'pot',
  'dutch-oven',
  'wok',
  'steamer',
  'oven',
  'stove',
  'grill',
  'microwave',
  'toaster',
  'knife',
  'cutlery',
  'spoon',
  'bowl',
  'mortar',
  'blender',
  'processor',
  'chef-hat',
  'scale',
  'thermometer',
  'timer',
  'cup',
  'fork-knife',
] as const

export type GlossaryIconKey = (typeof GLOSSARY_ICON_KEYS)[number]

export const GLOSSARY_ICONIFY_BY_KEY: Record<GlossaryIconKey, string> = {
  pan: 'i-lucide-utensils',
  pot: 'i-lucide-cooking-pot',
  'dutch-oven': 'i-lucide-cooking-pot',
  wok: 'i-lucide-soup',
  steamer: 'i-lucide-cloud-fog',
  oven: 'i-lucide-flame',
  stove: 'i-lucide-flame',
  grill: 'i-lucide-flame',
  microwave: 'i-lucide-microwave',
  toaster: 'i-lucide-sandwich',
  knife: 'i-lucide-utensils',
  cutlery: 'i-lucide-utensils-crossed',
  spoon: 'i-lucide-utensils',
  bowl: 'i-lucide-soup',
  mortar: 'i-lucide-hammer',
  blender: 'i-lucide-blender',
  processor: 'i-lucide-cog',
  'chef-hat': 'i-lucide-chef-hat',
  scale: 'i-lucide-scale',
  thermometer: 'i-lucide-thermometer',
  timer: 'i-lucide-timer',
  cup: 'i-lucide-cup-soda',
  'fork-knife': 'i-lucide-utensils-crossed',
}

export const GLOSSARY_ICON_FALLBACK: GlossaryIconKey = 'cutlery'

export const GLOSSARY_ICON_LABELS_FR: Record<GlossaryIconKey, string> = {
  pan: 'Poêle',
  pot: 'Casserole',
  'dutch-oven': 'Cocotte',
  wok: 'Wok',
  steamer: 'Cuit-vapeur',
  oven: 'Four',
  stove: 'Plaque / feu',
  grill: 'Grillade',
  microwave: 'Micro-ondes',
  toaster: 'Grille-pain',
  knife: 'Couteau de chef',
  cutlery: 'Couverts',
  spoon: 'Cuillère / louche',
  bowl: 'Saladier',
  mortar: 'Mortier',
  blender: 'Mixeur plongeant',
  processor: 'Robot',
  'chef-hat': 'Toque',
  scale: 'Balance',
  thermometer: 'Thermomètre',
  timer: 'Minuteur',
  cup: 'Verre doseur',
  'fork-knife': 'Service',
}

export type GlossaryUtensilCategory = 'cuisson' | 'preparation' | 'mesure' | 'electro' | 'service'

export const GLOSSARY_UTENSIL_CATEGORIES = [
  'cuisson',
  'preparation',
  'mesure',
  'electro',
  'service',
] as const satisfies readonly GlossaryUtensilCategory[]

export const GLOSSARY_ICON_CATEGORY: Record<GlossaryIconKey, GlossaryUtensilCategory> = {
  pan: 'cuisson',
  pot: 'cuisson',
  'dutch-oven': 'cuisson',
  wok: 'cuisson',
  steamer: 'cuisson',
  oven: 'cuisson',
  stove: 'cuisson',
  grill: 'cuisson',
  microwave: 'electro',
  toaster: 'electro',
  knife: 'preparation',
  cutlery: 'preparation',
  spoon: 'preparation',
  bowl: 'preparation',
  mortar: 'preparation',
  blender: 'electro',
  processor: 'electro',
  'chef-hat': 'preparation',
  scale: 'mesure',
  thermometer: 'mesure',
  timer: 'mesure',
  cup: 'mesure',
  'fork-knife': 'service',
}

export const GLOSSARY_UTENSIL_CATEGORY_LABELS_FR: Record<GlossaryUtensilCategory, string> = {
  cuisson: 'Cuisson',
  preparation: 'Préparation',
  mesure: 'Mesure',
  electro: 'Électro',
  service: 'Service',
}

const ICON_KEY_SET = new Set<string>(GLOSSARY_ICON_KEYS)

export function isGlossaryIconKey(value: unknown): value is GlossaryIconKey {
  return typeof value === 'string' && ICON_KEY_SET.has(value)
}

export function parseGlossaryIconKey(value: unknown): GlossaryIconKey | null {
  if (value == null || value === '') return null
  if (isGlossaryIconKey(value)) return value
  return null
}

export function resolveGlossaryIconify(iconKey: string | null | undefined): string {
  if (isGlossaryIconKey(iconKey)) {
    return GLOSSARY_ICONIFY_BY_KEY[iconKey]
  }
  return GLOSSARY_ICONIFY_BY_KEY[GLOSSARY_ICON_FALLBACK]
}

export function listGlossaryIcons(category?: GlossaryUtensilCategory) {
  return GLOSSARY_ICON_KEYS
    .filter(key => !category || GLOSSARY_ICON_CATEGORY[key] === category)
    .map(key => ({
      key,
      label: GLOSSARY_ICON_LABELS_FR[key],
      iconify: GLOSSARY_ICONIFY_BY_KEY[key],
      category: GLOSSARY_ICON_CATEGORY[key],
    }))
}
