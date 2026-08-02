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

export function isEditorTransformMode(mode: EditorCompletionMode): mode is EditorTransformMode {
  return (EDITOR_TRANSFORM_MODES as readonly string[]).includes(mode)
}
