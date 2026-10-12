import type { GlossaryKind } from './glossary-normalize'

export function glossaryLineTermError(
  term: { id: number, kind: string } | null | undefined,
  expected: GlossaryKind,
): string | null {
  if (!term) {
    return 'Terme de glossaire introuvable.'
  }
  if (term.kind !== expected) {
    switch (expected) {
      case 'ingredient':
        return 'Cette ligne attend un ingrédient, pas un ustensile ou une technique.'
      case 'ustensile':
        return 'Cette ligne attend un ustensile, pas un ingrédient ou une technique.'
      case 'technique':
        return 'Cette ligne attend une technique.'
      default: {
        const _exhaustive: never = expected
        return _exhaustive
      }
    }
  }
  return null
}
