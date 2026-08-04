/**
 * Editor AI completion modes — shared by API, prompts, and Nuxt UI handlers.
 */
export const EDITOR_COMPLETION_MODES = [
  'continue',
  'fix',
  'extend',
  'reduce',
  'simplify',
  'summarize',
  'translate',
] as const

export type EditorCompletionMode = (typeof EDITOR_COMPLETION_MODES)[number]

/** Modes that replace the current selection (vs ghost-text continue). */
export const EDITOR_TRANSFORM_MODES = [
  'fix',
  'extend',
  'reduce',
  'simplify',
  'summarize',
  'translate',
] as const

export type EditorTransformMode = (typeof EDITOR_TRANSFORM_MODES)[number]

/**
 * Reformulation modes that offer two streamed alternatives for the editor to pick.
 * Orthographe (`fix`) uses the structured proofread flow instead.
 */
export const EDITOR_VARIANT_MODES = [
  'extend',
  'reduce',
  'simplify',
  'summarize',
  'translate',
] as const

export type EditorVariantMode = (typeof EDITOR_VARIANT_MODES)[number]

export function isEditorTransformMode(mode: EditorCompletionMode): mode is EditorTransformMode {
  return (EDITOR_TRANSFORM_MODES as readonly string[]).includes(mode)
}

export function isEditorVariantMode(mode: EditorCompletionMode): mode is EditorVariantMode {
  return (EDITOR_VARIANT_MODES as readonly string[]).includes(mode)
}

export interface ProofreadCorrection {
  /** Unique id for UI keys. */
  id: string
  /** Exact substring from the selected text. */
  original: string
  /** Suggested replacement. */
  suggestion: string
  /** Short French explanation. */
  message: string
  /** UTF-16 offsets within the selected plain text. */
  start: number
  end: number
}
