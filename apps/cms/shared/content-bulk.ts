export const BULK_IDS_MAX = 150

export type BulkContentAction = 'delete' | 'publish' | 'unpublish'
export type BulkPageAction = BulkContentAction | 'move'

export interface BulkItemFailure {
  id: number
  message: string
}

export interface BulkMutationResult {
  action: BulkPageAction
  ids: number[]
  count: number
  failed?: BulkItemFailure[]
  skippedHomeIds?: number[]
  missingIds?: number[]
  movedIds?: number[]
  parentId?: number | null
  createdParentId?: number
}

export interface BulkNoun {
  singular: string
  plural: string
  feminine?: boolean
}

export function partitionBulkIds(requestedIds: number[], foundIds: number[]) {
  const found = new Set(foundIds)
  return {
    foundIds: [...found],
    missingIds: requestedIds.filter(id => !found.has(id)),
  }
}

export function excludeHomeRows<T extends { id: number, isHome?: boolean | null }>(rows: T[]) {
  const skippedHomeIds = rows.filter(row => Boolean(row.isHome)).map(row => row.id)
  const workRows = rows.filter(row => !row.isHome)
  return {
    skippedHomeIds,
    workRows,
    workIds: workRows.map(row => row.id),
  }
}

/** Keep a nested selection as a tree: skip ids whose ancestor is also selected. */
export function filterSelectionMoveRoots(
  selectedIds: number[],
  parentIdById: Map<number, number | null | undefined>,
): number[] {
  const selected = new Set(selectedIds)
  return selectedIds.filter((id) => {
    let current = parentIdById.get(id) ?? null
    const seen = new Set<number>([id])
    while (current != null && !seen.has(current)) {
      if (selected.has(current)) return false
      seen.add(current)
      current = parentIdById.get(current) ?? null
    }
    return true
  })
}

export function bulkParticipleEnding(noun: BulkNoun, count: number): string {
  const feminine = Boolean(noun.feminine)
  const plural = count > 1
  if (feminine) return plural ? 'es' : 'e'
  return plural ? 's' : ''
}

export function bulkDemonstrative(noun: BulkNoun): string {
  if (noun.feminine) return 'Cette'
  return /^[aeiouàâäéèêëïîôùûü]/i.test(noun.singular) ? 'Cet' : 'Ce'
}

export function bulkDeleteDescription(noun: BulkNoun, count: number): string {
  const ending = bulkParticipleEnding(noun, count)
  if (count > 1) {
    return `${count} ${noun.plural} seront masqué${ending}. Cette action est une suppression douce.`
  }
  return `${bulkDemonstrative(noun)} ${noun.singular} sera masqué${ending}. Cette action est une suppression douce.`
}

function capitalizeNoun(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

export function bulkSuccessTitle(
  noun: BulkNoun,
  action: BulkPageAction,
  count: number,
): string {
  const word = count > 1 ? noun.plural : noun.singular
  const ending = bulkParticipleEnding(noun, count)
  let verb: string
  switch (action) {
    case 'delete':
      verb = 'supprimé'
      break
    case 'publish':
      verb = 'publié'
      break
    case 'unpublish':
      verb = 'dépublié'
      break
    case 'move':
      verb = 'déplacé'
      break
    default: {
      const _exhaustive: never = action
      return String(_exhaustive)
    }
  }

  return count > 1
    ? `${count} ${word} ${verb}${ending}`
    : `${capitalizeNoun(word)} ${verb}${ending}`
}
