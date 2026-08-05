import type { EditorCompletionMode } from '../../shared/editor-completion-modes'
import {
  EDITOR_COMPLETION_MODEL,
  WORKERS_AI_MODEL,
} from '../../shared/workers-ai-model'

/** Creative editor modes — Gemma reasoning helps quality. */
const CREATIVE_EDITOR_MODES = new Set<EditorCompletionMode>(['continue', 'extend'])

export function isCreativeEditorCompletionMode(mode: EditorCompletionMode): boolean {
  return CREATIVE_EDITOR_MODES.has(mode)
}

/**
 * Continuer / Développer → Gemma (reasoning OK).
 * Orthographe / Raccourcir / … → fast instruct model (no reasoning needed).
 */
export function resolveEditorCompletionModelId(mode: EditorCompletionMode) {
  return isCreativeEditorCompletionMode(mode)
    ? WORKERS_AI_MODEL
    : EDITOR_COMPLETION_MODEL
}

/**
 * Prefer model `text` (what TipTap inserts). If a reasoning model spent its
 * budget in the reasoning channel and left content empty, recover a usable
 * answer from reasoning — never dump raw chain-of-thought when a clearer
 * final span exists.
 */
export function resolveVisibleCompletionText(parts: {
  text?: string | null
  reasoningText?: string | null
}): string {
  const text = parts.text?.trim() ?? ''
  if (text) {
    return text
  }

  const reasoning = parts.reasoningText?.trim() ?? ''
  if (!reasoning) {
    return ''
  }

  return extractAnswerFromReasoning(reasoning)
}

/**
 * Pull a final answer out of CoT / reasoning blobs.
 * Prefers explicit answer markers, otherwise the last substantial paragraph.
 */
export function extractAnswerFromReasoning(reasoning: string): string {
  const marked = reasoning.match(
    /(?:^|\n)\s*(?:final\s*answer|answer|réponse|completion|output)\s*[:：]\s*([\s\S]+)$/i,
  )
  if (marked?.[1]?.trim()) {
    return marked[1].trim()
  }

  const fenced = [...reasoning.matchAll(/```(?:[\w-]+)?\n([\s\S]*?)```/g)]
  const lastFence = fenced.at(-1)?.[1]?.trim()
  if (lastFence) {
    return lastFence
  }

  return ''
}
