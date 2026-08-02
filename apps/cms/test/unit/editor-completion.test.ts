import { describe, expect, it } from 'vitest'
import {
  buildEditorCompletionConfig,
  truncateEditorPrompt,
} from '../../server/services/ai/editor-completion'

describe('editor-completion', () => {
  it('builds continue mode with short token budget', () => {
    const config = buildEditorCompletionConfig('continue')
    expect(config.maxOutputTokens).toBe(40)
    expect(config.system).toContain('inline autocompletions')
  })

  it('includes target language for translate mode', () => {
    const config = buildEditorCompletionConfig('translate', 'German')
    expect(config.system).toContain('German')
  })

  it('truncates long prompts from the end', () => {
    const prompt = 'a'.repeat(100)
    expect(truncateEditorPrompt(prompt, 50).length).toBe(50)
    expect(truncateEditorPrompt(prompt, 50)).toBe('a'.repeat(50))
  })
})
