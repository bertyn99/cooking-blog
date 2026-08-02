export type EditorCompletionMode =
  | 'continue'
  | 'fix'
  | 'extend'
  | 'reduce'
  | 'simplify'
  | 'summarize'
  | 'translate'

export interface EditorCompletionConfig {
  system: string
  maxOutputTokens: number
}

const PRESERVE_MARKDOWN
  = 'IMPORTANT: Preserve all markdown formatting (bold, italic, links, headings, lists, etc.) exactly as in the original when applicable.'

const FRENCH_COPY
  = 'The site is a French cooking blog (journalducuistot.fr). Prefer natural French unless translating to another language.'

export function buildEditorCompletionConfig(
  mode: EditorCompletionMode,
  language?: string | null,
): EditorCompletionConfig {
  switch (mode) {
    case 'fix':
      return {
        system: [
          'You are a writing assistant.',
          `Fix spelling and grammar. ${FRENCH_COPY}`,
          PRESERVE_MARKDOWN,
          'Only output the corrected text, nothing else.',
        ].join(' '),
        maxOutputTokens: 500,
      }
    case 'extend':
      return {
        system: [
          'You are a writing assistant.',
          `Extend the text with useful culinary detail while keeping the same tone. ${FRENCH_COPY}`,
          PRESERVE_MARKDOWN,
          'Only output the extended text, nothing else.',
        ].join(' '),
        maxOutputTokens: 500,
      }
    case 'reduce':
      return {
        system: [
          'You are a writing assistant.',
          `Make the text more concise without losing meaning. ${FRENCH_COPY}`,
          PRESERVE_MARKDOWN,
          'Only output the reduced text, nothing else.',
        ].join(' '),
        maxOutputTokens: 300,
      }
    case 'simplify':
      return {
        system: [
          'You are a writing assistant.',
          `Simplify vocabulary and sentence structure. ${FRENCH_COPY}`,
          PRESERVE_MARKDOWN,
          'Only output the simplified text, nothing else.',
        ].join(' '),
        maxOutputTokens: 400,
      }
    case 'summarize':
      return {
        system: [
          'You are a writing assistant.',
          `Summarize concisely while keeping key points. ${FRENCH_COPY}`,
          'Only output the summary, nothing else.',
        ].join(' '),
        maxOutputTokens: 200,
      }
    case 'translate':
      return {
        system: [
          'You are a writing assistant.',
          `Translate the text to ${language?.trim() || 'English'}.`,
          PRESERVE_MARKDOWN,
          'Only output the translated text, nothing else.',
        ].join(' '),
        maxOutputTokens: 500,
      }
    case 'continue':
    default:
      return {
        system: [
          'You are a writing assistant providing inline autocompletions.',
          FRENCH_COPY,
          'CRITICAL RULES:',
          '- Output ONLY the NEW text that comes AFTER the user\'s input',
          '- NEVER repeat words from the end of the user\'s text',
          '- Keep completions short (one sentence max)',
          '- Match the tone and style of the existing text',
          `- ${PRESERVE_MARKDOWN}`,
        ].join('\n'),
        maxOutputTokens: 40,
      }
  }
}

export const EDITOR_COMPLETION_MAX_PROMPT_CHARS = 12_000

export function truncateEditorPrompt(prompt: string, maxChars = EDITOR_COMPLETION_MAX_PROMPT_CHARS): string {
  if (prompt.length <= maxChars) {
    return prompt
  }
  return prompt.slice(prompt.length - maxChars)
}
