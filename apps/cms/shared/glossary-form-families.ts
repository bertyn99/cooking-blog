import { glossarySortKey } from './glossary-normalize'

/**
 * Curated culinary *product* forms — not aliases, not recipe notes.
 *
 * - Root = what you buy as the ingredient itself (Amande).
 * - Form = a distinct product (lait d’amande, pâte d’amande, amande en poudre).
 * - Prep states belong in the recipe `note` (fondu, tamisée, ciselée) and are
 *   not listed here, so we never auto-merge farine vs farine de blé, or
 *   graine d’anis vs graines de sésame.
 *
 * Each form is its own glossary row (slug, SEO, cover). The seeder only sets
 * `parentId`; it never copies `coverBlobPathname` from the root.
 */
export interface GlossaryFormFamily {
  root: string
  forms: readonly string[]
}

export const GLOSSARY_INGREDIENT_FORM_FAMILIES = [
  {
    root: 'Amande',
    forms: [
      'Amande en poudre',
      'Amandes en poudre',
      'Amande moulue',
      'Amandes moulues',
      'Amande séchée',
      'Amandes séchées',
      'Amande effilée',
      'Amandes effilées',
      'Amande mondée',
      'Amandes mondées',
      "Pâte d'amande",
      "Lait d'amande",
      "Huile d'amande",
    ],
  },
  {
    root: 'Noisette',
    forms: [
      'Noisette en poudre',
      'Noisettes en poudre',
      'Noisette moulue',
      'Pâte de noisette',
      'Praliné noisette',
      'Huile de noisette',
      'Lait de noisette',
    ],
  },
  {
    root: 'Noix de coco',
    forms: [
      'Noix de coco râpée',
      'Coco râpé',
      'Lait de coco',
      'Crème de coco',
      'Huile de coco',
    ],
  },
  {
    root: 'Sésame',
    forms: [
      'Graines de sésame',
      'Graines de sésame dorées',
      'Graines de sésame dorées et moulues',
      'Sésame moulu',
      'Tahini',
      'Pâte de sésame',
      'Huile de sésame',
    ],
  },
  {
    root: 'Ail',
    forms: [
      'Ail en poudre',
      'Ail semoule',
      'Ail séché',
    ],
  },
  {
    root: 'Oignon',
    forms: [
      'Oignon en poudre',
      'Oignon séché',
    ],
  },
] as const satisfies readonly GlossaryFormFamily[]

/** Apostrophe-insensitive key for the curated family catalog (does not change DB sort_key). */
export function normalizeGlossaryCatalogKey(value: string): string {
  return glossarySortKey(value).replace(/['’`]/g, "'")
}

const formSortKeyToRootName = new Map<string, string>()
const rootSortKeys = new Set<string>()

for (const family of GLOSSARY_INGREDIENT_FORM_FAMILIES) {
  rootSortKeys.add(normalizeGlossaryCatalogKey(family.root))
  for (const form of family.forms) {
    formSortKeyToRootName.set(normalizeGlossaryCatalogKey(form), family.root)
  }
}

/** Family root display name for a known form sort_key, or null if this is a root / unknown. */
export function knownIngredientFamilyRootName(sortKey: string): string | null {
  const key = normalizeGlossaryCatalogKey(sortKey)
  if (rootSortKeys.has(key)) return null
  return formSortKeyToRootName.get(key) ?? null
}

export function isKnownIngredientFamilyRoot(sortKey: string): boolean {
  return rootSortKeys.has(normalizeGlossaryCatalogKey(sortKey))
}

/**
 * A family root must not use a culinary form as an alias (lait d’amande on Amande),
 * or extract/save would attach recipe lines to the root. Plurals of the same
 * form ("amandes en poudre" on "Amande en poudre") stay allowed.
 */
export function aliasConflictsWithCulinaryForm(termSortKey: string, aliasNormalized: string): boolean {
  const termKey = normalizeGlossaryCatalogKey(termSortKey)
  const aliasKey = normalizeGlossaryCatalogKey(aliasNormalized)
  if (termKey === aliasKey) return false
  if (!isKnownIngredientFamilyRoot(termKey)) return false
  return knownIngredientFamilyRootName(aliasKey) != null
}
