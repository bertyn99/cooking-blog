import { describe, expect, it } from 'vitest'
import {
  EDITOR_COMPLETION_MODES,
  isEditorTransformMode,
} from '../../shared/editor-completion-modes'
import {
  buildEditorCompletionConfig,
  truncateEditorPrompt,
} from '../../server/services/ai/editor-completion'

describe('editor-completion', () => {
  it('builds continue mode with short token budget', () => {
    const config = buildEditorCompletionConfig('continue')
    expect(config.maxOutputTokens).toBe(40)
    expect(config.system).toContain('inline autocompletions')
    expect(config.cacheTtl).toBeUndefined()
  })

  it('includes target language for translate mode', () => {
    const config = buildEditorCompletionConfig('translate', 'German')
    expect(config.system).toContain('German')
  })

  it('adds gateway cache for deterministic transform modes', () => {
    expect(buildEditorCompletionConfig('fix').cacheTtl).toBe(3600)
    expect(buildEditorCompletionConfig('summarize').cacheTtl).toBe(3600)
  })

  it('covers every completion mode without throwing', () => {
    for (const mode of EDITOR_COMPLETION_MODES) {
      const config = buildEditorCompletionConfig(mode, mode === 'translate' ? 'English' : undefined)
      expect(config.system.length).toBeGreaterThan(10)
      expect(config.maxOutputTokens).toBeGreaterThan(0)
    }
  })

  it('classifies transform vs continue modes', () => {
    expect(isEditorTransformMode('continue')).toBe(false)
    expect(isEditorTransformMode('fix')).toBe(true)
    expect(isEditorTransformMode('translate')).toBe(true)
  })

  it('truncates long prompts from the end', () => {
    const prompt = 'a'.repeat(100)
    expect(truncateEditorPrompt(prompt, 50).length).toBe(50)
    expect(truncateEditorPrompt(prompt, 50)).toBe('a'.repeat(50))
  })
})
