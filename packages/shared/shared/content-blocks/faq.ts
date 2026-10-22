export interface JdcFaqItem {
  question: string
  answer: string
}

function asRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function pickText(record: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
    if (asRecord(value) && typeof value.text === 'string' && value.text.trim()) {
      return value.text.trim()
    }
  }
  return ''
}

/** Accepts Comark JSON (`question`/`answer` or `q`/`a`) or a parsed array. */
export function parseFaqItems(raw: string | JdcFaqItem[] | null | undefined): JdcFaqItem[] {
  let parsed: unknown = raw
  if (typeof raw === 'string') {
    const trimmed = raw.trim()
    if (!trimmed) return []
    try {
      parsed = JSON.parse(trimmed)
    }
    catch {
      return []
    }
  }
  if (!Array.isArray(parsed)) return []
  return parsed
    .filter(asRecord)
    .map(item => ({
      question: pickText(item, ['question', 'q', 'name', 'label']),
      answer: pickText(item, ['answer', 'a', 'acceptedAnswer', 'text', 'content']),
    }))
    .filter(item => item.question.length > 0 && item.answer.length > 0)
}

export const DEFAULT_FAQ_ITEMS_JSON = JSON.stringify([
  {
    question: 'Quelle huile pour saisir ?',
    answer: 'Une huile qui tient le vif. Le beurre seul brunit trop tôt.',
  },
  {
    question: 'Faut-il retourner une seule fois ?',
    answer: 'Non. Kenji : retourner souvent cuit plus régulièrement un steak.',
  },
])
