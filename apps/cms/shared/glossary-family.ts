export type GlossaryFamilyRef = {
  id: number
  name: string
  slug?: string
  status?: string
}

export type GlossaryPickerTerm = {
  id: number
  name: string
  slug?: string
  status?: string
  parentId?: number | null
  parent?: GlossaryFamilyRef | null
  icon?: string | null
  resolvedAffiliateUrl?: string | null
}

export type GlossaryPickerItem = GlossaryPickerTerm & {
  label: string
  description?: string
}

export type GlossaryPickerMenuItem =
  | { type: 'label', label: string }
  | GlossaryPickerItem

/** Root of a one-level form family (Amande), never a child form. */
export function glossaryFamilyRootId(term: { id: number, parentId?: number | null }): number {
  return term.parentId ?? term.id
}

/**
 * "Autres formes" on a form page is siblings only — the family root is
 * already shown as "Forme de Amande", not as another form chip.
 */
export function glossarySiblingForms<T extends { id: number }>(
  members: T[],
  term: { parentId?: number | null },
): T[] {
  if (term.parentId == null) return members
  return members.filter(member => member.id !== term.parentId)
}

export function glossaryFamilyLabel(term: Pick<GlossaryPickerTerm, 'parent'>): string | null {
  const name = term.parent?.name?.trim()
  return name || null
}

/**
 * Groups culinary forms under their family head for the recipe picker.
 * Ungrouped terms stay at the end (labelled Autres when any family exists).
 */
export function groupGlossaryPickerItems(
  terms: GlossaryPickerTerm[],
  opts?: { showIcons?: boolean },
): GlossaryPickerMenuItem[] {
  const showIcons = opts?.showIcons === true
  const groups = new Map<string, GlossaryPickerTerm[]>()
  const ungrouped: GlossaryPickerTerm[] = []

  for (const term of terms) {
    const family = glossaryFamilyLabel(term)
    if (family) {
      const bucket = groups.get(family) ?? []
      bucket.push(term)
      groups.set(family, bucket)
    }
    else {
      ungrouped.push(term)
    }
  }

  const toItem = (term: GlossaryPickerTerm): GlossaryPickerItem => {
    const family = glossaryFamilyLabel(term)
    return {
      ...term,
      label: term.name,
      description: family ? `forme de ${family}` : undefined,
      icon: showIcons ? (term.icon ?? undefined) : undefined,
    }
  }

  const result: GlossaryPickerMenuItem[] = []
  for (const [label, rows] of groups) {
    result.push({ type: 'label', label })
    result.push(...rows.map(toItem))
  }
  if (ungrouped.length && groups.size) {
    result.push({ type: 'label', label: 'Autres' })
  }
  result.push(...ungrouped.map(toItem))
  return result
}
