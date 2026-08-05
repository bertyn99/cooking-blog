import { describe, expect, it } from 'vitest'
import {
  EDITOR_COMPLETION_MODEL,
  WORKERS_AI_MODEL,
} from '../../shared/workers-ai-model'
import {
  extractAnswerFromReasoning,
  isCreativeEditorCompletionMode,
  resolveEditorCompletionModelId,
  resolveVisibleCompletionText,
} from '../../server/utils/editor-completion-output'

describe('editor-completion-output', () => {
  it('routes continue/extend to Gemma and transforms to instruct', () => {
    expect(isCreativeEditorCompletionMode('continue')).toBe(true)
    expect(isCreativeEditorCompletionMode('extend')).toBe(true)
    expect(isCreativeEditorCompletionMode('fix')).toBe(false)
    expect(resolveEditorCompletionModelId('continue')).toBe(WORKERS_AI_MODEL)
    expect(resolveEditorCompletionModelId('extend')).toBe(WORKERS_AI_MODEL)
    expect(resolveEditorCompletionModelId('fix')).toBe(EDITOR_COMPLETION_MODEL)
  })

  it('prefers visible text over reasoning', () => {
    expect(resolveVisibleCompletionText({
      text: ' suite du paragraphe.',
      reasoningText: 'I should continue with food details...',
    })).toBe('suite du paragraphe.')
  })

  it('recovers an answer from reasoning when text is empty', () => {
    expect(resolveVisibleCompletionText({
      text: '',
      reasoningText: 'The user stopped mid-sentence.\n\nFinal answer: aromatisé au cumin et au paprika.',
    })).toBe('aromatisé au cumin et au paprika.')
  })

  it('does not treat unstructured reasoning as completion text', () => {
    expect(extractAnswerFromReasoning([
      'Let me think about a natural continuation.',
      '',
      'I should keep the French cooking tone.',
      '',
      'servi avec une sauce au citron.',
    ].join('\n'))).toBe('')
  })
})
