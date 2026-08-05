import { generateText } from 'ai'
import { z } from 'zod'
import { EDITOR_COMPLETION_MODEL } from '../../../shared/workers-ai-model'
import type { ProofreadCorrection } from '../../../shared/editor-completion-modes'
import { isPlausibleSpellingFix, proofreadMaxSpanChars } from '../../../shared/proofread-sanitize'
import { createCmsWorkersAI } from '../../utils/cms-workers-ai'
import { resolveVisibleCompletionText } from '../../utils/editor-completion-output'

const proofreadItemSchema = z.object({
  original: z.string().min(1),
  suggestion: z.string().min(1),
  message: z.string().min(1).max(200),
  start: z.number().int().nonnegative(),
  end: z.number().int().positive(),
})

const proofreadPayloadSchema = z.object({
  corrections: z.array(proofreadItemSchema).max(40),
})

function makeId(index: number, original: string): string {
  return `pr-${index}-${original.slice(0, 12)}`
}

/**
 * Locate each correction inside `text` (prefer model offsets, fall back to indexOf).
 */
export function normalizeProofreadCorrections(
  text: string,
  raw: z.infer<typeof proofreadPayloadSchema>['corrections'],
): ProofreadCorrection[] {
  const out: ProofreadCorrection[] = []
  let cursor = 0

  for (let i = 0; i < raw.length; i++) {
    const item = raw[i]!
    let start = item.start
    let end = item.end

    const slice = text.slice(start, end)
    if (slice !== item.original) {
      const candidates: number[] = []
      let searchFrom = 0
      while (searchFrom <= text.length) {
        const idx = text.indexOf(item.original, searchFrom)
        if (idx === -1) {
          break
        }
        candidates.push(idx)
        searchFrom = idx + 1
      }
      if (!candidates.length) {
        continue
      }
      const preferred = candidates.reduce((best, idx) =>
        Math.abs(idx - item.start) < Math.abs(best - item.start) ? idx : best,
      )
      start = preferred
      end = preferred + item.original.length
    }

    if (end <= start || end > text.length) {
      continue
    }

    out.push({
      id: makeId(i, item.original),
      original: item.original,
      suggestion: item.suggestion,
      message: item.message,
      start,
      end,
    })
    cursor = end
  }

  // Drop no-ops, rewrites, and huge spans (whole-paragraph "corrections" confuse the UI).
  const maxSpan = proofreadMaxSpanChars(text.length)
  return out.filter((item) => {
    if (item.end - item.start > maxSpan) {
      return false
    }
    if (text.slice(item.start, item.end) !== item.original) {
      return false
    }
    return isPlausibleSpellingFix(item.original, item.suggestion)
  })
}

function tryParseJson(raw: string): unknown {
  try {
    return JSON.parse(raw)
  }
  catch {
    return undefined
  }
}

function extractJsonObject(raw: string): unknown {
  const trimmed = raw.trim()
  const direct = tryParseJson(trimmed)
  if (direct !== undefined) {
    return direct
  }

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fenced?.[1]) {
    const parsed = tryParseJson(fenced[1].trim())
    if (parsed !== undefined) {
      return parsed
    }
  }

  const brace = trimmed.match(/\{[\s\S]*\}/)
  if (brace) {
    const parsed = tryParseJson(brace[0])
    if (parsed !== undefined) {
      return parsed
    }
  }

  throw new Error('Réponse proofread non JSON')
}

export async function runEditorProofread(options: {
  ai: Ai
  text: string
  gatewayId?: string | null
  userId: string
}): Promise<ProofreadCorrection[]> {
  const workersai = createCmsWorkersAI(options.ai, {
    gatewayId: options.gatewayId ?? null,
    cacheTtl: 3600,
    metadata: {
      surface: 'editor-proofread',
      userId: options.userId,
    },
  })

  const system = [
    'Tu es un correcteur orthographique et grammatical pour un blog de cuisine francophone (français de France, FR-FR).',
    'Le texte fourni est déjà en français : ne le traduis jamais, ne le réécris jamais, ne propose aucun anglicisme.',
    'Signale UNIQUEMENT des fautes réelles : accents manquants, typos, accords (genre/nombre), conjugaison.',
    'Si le français est correct, renvoie exactement {"corrections":[]}.',
    'Réponds UNIQUEMENT avec un JSON valide de cette forme :',
    '{"corrections":[{"original":"...","suggestion":"...","message":"...","start":0,"end":5}]}',
    'Règles strictes :',
    '- original = sous-chaîne exacte du texte (un seul mot, le plus court possible)',
    '- suggestion = même mot corrigé (proche : accent, lettre manquante, accord)',
    '- start/end = offsets caractères 0-based dans le texte d’entrée',
    '- message = courte explication en français',
    '- INTERDIT : synonymes, style, ton, emoji, ponctuation « préférée », reformulation',
    '- INTERDIT : signaler un mot français correct',
    '- INTERDIT : correction qui couvre une phrase ou un paragraphe entier',
  ].join('\n')

  const generated = await generateText({
    model: workersai(EDITOR_COMPLETION_MODEL),
    system,
    prompt: [
      'Vérifie ce texte en français de France. Ne renvoie des corrections que s’il y a de vraies fautes.',
      '',
      options.text,
    ].join('\n'),
    maxOutputTokens: 800,
    temperature: 0,
    reasoning: 'none',
    providerOptions: {
      'workers-ai': {
        reasoning_effort: null,
      },
    },
  })

  const visible = resolveVisibleCompletionText({
    text: generated.text,
    reasoningText: generated.reasoningText,
  })
  if (!visible) {
    return []
  }

  const parsed = proofreadPayloadSchema.safeParse(extractJsonObject(visible))
  if (!parsed.success) {
    return []
  }

  return normalizeProofreadCorrections(options.text, parsed.data.corrections)
}
