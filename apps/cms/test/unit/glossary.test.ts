import { describe, expect, it } from 'vitest'
import {
  amazonAffiliatePreviewUrl,
  buildAmazonProductUrl,
  extractAmazonAsin,
  normalizeAmazonAsin,
  resolveGlossaryAffiliateUrl,
} from '../../shared/glossary-affiliate'
import {
  GLOSSARY_ICON_FALLBACK,
  isGlossaryIconKey,
  parseGlossaryIconKey,
  resolveGlossaryIconify,
} from '../../shared/glossary-icons'
import {
  dedupeIngredientNames,
  glossarySortKey,
  parseIngredientDisplayName,
  uniqueSlugs,
} from '../../shared/glossary-normalize'
import { glossaryPublicPath } from '../../shared/public-site-paths'
import { glossaryFamilyRootId, glossarySiblingForms, groupGlossaryPickerItems } from '../../shared/glossary-family'
import {
  aliasConflictsWithCulinaryForm,
  knownIngredientFamilyRootName,
  isKnownIngredientFamilyRoot,
} from '../../shared/glossary-form-families'
import {
  GLOSSARY_INDEX_ROBOTS,
  GLOSSARY_NOINDEX_ROBOTS,
  glossaryRobotsForStatus,
  isNoindexRobots,
} from '../../shared/glossary-robots'
import { glossaryLineTermError } from '../../shared/glossary-lines'

describe('glossary normalize', () => {
  it('trims, lowercases and unaccents for sort_key', () => {
    expect(glossarySortKey('  Farine  ')).toBe('farine')
    expect(glossarySortKey('Poêle')).toBe('poele')
    expect(glossarySortKey('œufs')).toBe('oeufs')
  })

  it('moves trailing parentheses into note', () => {
    expect(parseIngredientDisplayName('sel (pincée)')).toEqual({
      name: 'sel',
      note: 'pincée',
      sortKey: 'sel',
    })
    expect(parseIngredientDisplayName('farine de blé')).toEqual({
      name: 'farine de blé',
      note: null,
      sortKey: 'farine de ble',
    })
  })

  it('dedups exact names only after normalize', () => {
    const groups = dedupeIngredientNames([
      { originalName: 'Farine' },
      { originalName: 'farine' },
      { originalName: 'farine de blé' },
      { originalName: 'Farine (tamiser)' },
    ])
    const keys = groups.map(group => group.sortKey).sort()
    expect(keys).toEqual(['farine', 'farine de ble'])
    const farine = groups.find(group => group.sortKey === 'farine')
    expect(farine?.sources).toHaveLength(3)
  })

  it('does not merge lait and lait entier', () => {
    const groups = dedupeIngredientNames([
      { originalName: 'lait' },
      { originalName: 'lait entier' },
      { originalName: 'beurre' },
      { originalName: 'beurre demi-sel' },
    ])
    expect(groups).toHaveLength(4)
  })

  it('suffixes colliding slugs', () => {
    const slugs = uniqueSlugs([
      { slug: 'sel', sortKey: 'sel' },
      { slug: 'sel', sortKey: 'sel-gros' },
    ])
    expect(slugs.get('sel')).toBe('sel')
    expect(slugs.get('sel-gros')).toBe('sel-2')
  })
})

describe('glossary affiliate resolve', () => {
  it('prefers partner_url over Amazon', () => {
    expect(resolveGlossaryAffiliateUrl({
      partnerUrl: 'https://marque.example/poele',
      amazonAsin: 'B00TEST123',
      amazonTag: 'jdc-21',
    })).toBe('https://marque.example/poele')
  })

  it('builds Amazon URL with tag', () => {
    expect(resolveGlossaryAffiliateUrl({
      amazonAsin: 'B00TEST123',
      amazonTag: 'jdc-21',
    })).toBe('https://www.amazon.fr/dp/B00TEST123?tag=jdc-21')
  })

  it('returns null without partner or ASIN', () => {
    expect(resolveGlossaryAffiliateUrl({ amazonTag: 'jdc-21' })).toBeNull()
  })

  it('extracts ASIN from Amazon URLs and rejects junk', () => {
    expect(extractAmazonAsin('https://www.amazon.fr/dp/B00TEST123?tag=x')).toBe('B00TEST123')
    expect(normalizeAmazonAsin('not-an-asin')).toBeNull()
    expect(amazonAffiliatePreviewUrl('jdc-21')).toBe(
      buildAmazonProductUrl('B000000000', 'jdc-21'),
    )
  })
})

describe('glossary icon allowlist', () => {
  it('accepts semantic keys and rejects Iconify strings', () => {
    expect(isGlossaryIconKey('pan')).toBe(true)
    expect(isGlossaryIconKey('i-mdi-pot-mix')).toBe(false)
    expect(parseGlossaryIconKey('cutlery')).toBe('cutlery')
    expect(parseGlossaryIconKey('i-mdi-pot')).toBeNull()
  })

  it('maps keys to Iconify and falls back to cutlery', () => {
    expect(resolveGlossaryIconify('pan')).toBe('i-lucide-utensils')
    expect(resolveGlossaryIconify(null)).toBe(resolveGlossaryIconify(GLOSSARY_ICON_FALLBACK))
    expect(resolveGlossaryIconify('i-mdi-pot')).toBe('i-lucide-utensils-crossed')
  })
})

describe('glossary public path', () => {
  it('builds /glossaire/:slug', () => {
    expect(glossaryPublicPath('poele')).toBe('/glossaire/poele')
  })
})

describe('glossary ingredient families', () => {
  it('uses parentId as the family root, otherwise the term itself', () => {
    expect(glossaryFamilyRootId({ id: 2, parentId: 1 })).toBe(1)
    expect(glossaryFamilyRootId({ id: 1, parentId: null })).toBe(1)
  })

  it('groups culinary forms under the family head and leaves other terms ungrouped', () => {
    const items = groupGlossaryPickerItems([
      { id: 2, name: 'Lait d’amande', parent: { id: 1, name: 'Amande' } },
      { id: 3, name: 'Pâte d’amande', parent: { id: 1, name: 'Amande' } },
      { id: 4, name: 'Beurre doux' },
    ], { showIcons: false })

    expect(items[0]).toEqual({ type: 'label', label: 'Amande' })
    expect(items[1]).toMatchObject({
      id: 2,
      label: 'Lait d’amande',
      description: 'forme de Amande',
      icon: undefined,
    })
    expect(items[2]).toMatchObject({ id: 3, label: 'Pâte d’amande' })
    expect(items[3]).toEqual({ type: 'label', label: 'Autres' })
    expect(items[4]).toMatchObject({ id: 4, label: 'Beurre doux', description: undefined })
  })

  it('drops the family root from Autres formes on a form page', () => {
    const members = [
      { id: 1, name: 'Amande' },
      { id: 3, name: 'Pâte d’amande' },
    ]
    expect(glossarySiblingForms(members, { parentId: 1 })).toEqual([
      { id: 3, name: 'Pâte d’amande' },
    ])
    expect(glossarySiblingForms(members, { parentId: null })).toEqual(members)
  })
})

describe('glossary form families catalog', () => {
  it('maps culinary product forms to the family root, including plurals already in the CMS', () => {
    expect(knownIngredientFamilyRootName(glossarySortKey('Lait d’amande'))).toBe('Amande')
    expect(knownIngredientFamilyRootName(glossarySortKey("Lait d'amande"))).toBe('Amande')
    expect(knownIngredientFamilyRootName(glossarySortKey("Pâte d'amande"))).toBe('Amande')
    expect(knownIngredientFamilyRootName(glossarySortKey('Amandes en poudre'))).toBe('Amande')
    expect(knownIngredientFamilyRootName(glossarySortKey('amandes moulues'))).toBe('Amande')
    expect(knownIngredientFamilyRootName(glossarySortKey('Tahini'))).toBe('Sésame')
    expect(knownIngredientFamilyRootName(glossarySortKey('Lait de coco'))).toBe('Noix de coco')
  })

  it('does not treat the family root itself as a form', () => {
    expect(isKnownIngredientFamilyRoot(glossarySortKey('Amande'))).toBe(true)
    expect(knownIngredientFamilyRootName(glossarySortKey('Amande'))).toBeNull()
  })

  it('does not stem-group unrelated or prep-state names', () => {
    expect(knownIngredientFamilyRootName(glossarySortKey('farine de blé'))).toBeNull()
    expect(knownIngredientFamilyRootName(glossarySortKey('farine'))).toBeNull()
    expect(knownIngredientFamilyRootName(glossarySortKey("graine d'anis"))).toBeNull()
    expect(knownIngredientFamilyRootName(glossarySortKey('beurre fondu'))).toBeNull()
    expect(knownIngredientFamilyRootName(glossarySortKey("huile d'olive"))).toBeNull()
  })

  it('rejects culinary-form aliases on the family root, not plural aliases on a form', () => {
    expect(aliasConflictsWithCulinaryForm(glossarySortKey('Amande'), glossarySortKey("Lait d'amande"))).toBe(true)
    expect(aliasConflictsWithCulinaryForm(glossarySortKey('Amande'), glossarySortKey('amandes'))).toBe(false)
    expect(aliasConflictsWithCulinaryForm(
      glossarySortKey('Amande en poudre'),
      glossarySortKey('Amandes en poudre'),
    )).toBe(false)
  })
})

describe('glossary publish robots', () => {
  it('indexes on publish and noindexes stubs', () => {
    expect(glossaryRobotsForStatus('published')).toBe(GLOSSARY_INDEX_ROBOTS)
    expect(glossaryRobotsForStatus('draft')).toBe(GLOSSARY_NOINDEX_ROBOTS)
    expect(isNoindexRobots('noindex,follow')).toBe(true)
    expect(isNoindexRobots('index, follow')).toBe(false)
  })
})

describe('glossary recipe lines', () => {
  it('rejects a missing or wrong-kind term id', () => {
    expect(glossaryLineTermError(null, 'ingredient')).toBe('Terme de glossaire introuvable.')
    expect(glossaryLineTermError({ id: 1, kind: 'ustensile' }, 'ingredient')).toMatch(/ingrédient/)
    expect(glossaryLineTermError({ id: 1, kind: 'ingredient' }, 'ustensile')).toMatch(/ustensile/)
    expect(glossaryLineTermError({ id: 1, kind: 'ingredient' }, 'ingredient')).toBeNull()
  })
})
