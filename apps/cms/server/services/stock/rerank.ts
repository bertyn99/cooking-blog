import { CLEF_FLASH } from '../../../shared/workers-ai-model'
import type { H3Event } from 'h3'
import type { StockSearchItem } from './pexels'

/** Verdict for one stock candidate, produced by the decision model. */
export interface StockCandidateVerdict {
  id: string
  /** 0–10 fitness for the query. */
  score: number
  /** False when the candidate must not be imported (subject mismatch, text overlays…). */
  keep: boolean
  /** Short French rationale for the article writer. */
  reason: string
}

export interface StockRerankResult {
  ranking: StockCandidateVerdict[]
  recommendedId: string | null
  /** False when the model call failed and candidates stay in provider order. */
  ranked: boolean
}

/** Max candidates evaluated in one rerank pass (one CLEF call each, parallel). */
const MAX_CANDIDATES = 6

/**
 * Typed questions for the CLEF decision model — one call per candidate image.
 * CLEF returns a probability per question; criteria map 1:1 to the editorial
 * checklist in the jdc-article-writer skill.
 */
function candidateQuestions(query: string) {
  return {
    subject: {
      type: 'noul',
      instructions: `The search query is "${query}". Does the photo show this dish or subject? A close variant or the key ingredients is acceptable. Fail only when the photo shows something else entirely (a person, a landscape, a different dish).`,
    },
    single: {
      type: 'noul',
      instructions: 'Does the photo show one clear main subject rather than a collage, a multi-dish spread, or a cluttered unrelated scene?',
    },
    clean: {
      type: 'noul',
      instructions: 'Is the photo free of overlaid text, watermarks, logos, brand packaging, and non-food graphics?',
    },
    appetizing: {
      type: 'noul',
      instructions: 'Is this appetizing food photography suitable for a recipe blog — styled or natural presentation, good lighting, finished dish rather than raw ingredients (unless the query is an ingredient)?',
    },
  }
}

interface ClefAnswer {
  /** Probability 0–1 for noul questions. */
  probability?: number
  value?: unknown
}

interface ClefResponse {
  answers?: Record<string, ClefAnswer>
}

interface ClefInput {
  model: string
  state: string
  questions: Record<string, unknown>
  images?: string[]
}

/**
 * CLEF runner: `ai.run` binding first, Workers AI REST API as fallback.
 * The binding fails when the runtime registry (compat date) predates CLEF;
 * the REST call needs `CLOUDFLARE_ACCOUNT_ID` + `CLOUDFLARE_AI_API_TOKEN`.
 */
function createClefRunner(event: H3Event): (input: ClefInput) => Promise<ClefResponse> {
  const env = getCloudflareEnv(event)
  const binding = env?.AI
  const accountId = env?.CLOUDFLARE_ACCOUNT_ID
  const token = env?.CLOUDFLARE_AI_API_TOKEN

  const runRest = accountId && token
    ? async (input: ClefInput): Promise<ClefResponse> => {
        const res = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${CLEF_FLASH}`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(input),
            signal: AbortSignal.timeout(30_000),
          },
        )
        const json = await res.json() as { success?: boolean, result?: ClefResponse, errors?: Array<{ message?: string }> }
        if (!res.ok || !json.success) {
          const message = json.errors?.map(e => e.message).filter(Boolean).join('; ') || `HTTP ${res.status}`
          throw new Error(`REST: ${message}`)
        }
        return json.result ?? {}
      }
    : null

  if (!binding) {
    if (!runRest) {
      return () => Promise.reject(new Error('Ni binding AI ni identifiants REST disponibles'))
    }
    return runRest
  }

  return async (input) => {
    try {
      return await (binding.run as unknown as (model: string, inputIn: Record<string, unknown>) => Promise<ClefResponse>)(input.model, input)
    } catch (bindingError) {
      if (!runRest) throw bindingError
      return runRest(input)
    }
  }
}

/** Editorial criteria weights — subject match dominates the score. */
const WEIGHTS = { subject: 0.4, appetizing: 0.25, clean: 0.2, single: 0.15 } as const

function prob(answer: ClefAnswer | undefined): number {
  const p = Number(answer?.probability)
  return Number.isFinite(p) ? Math.max(0, Math.min(1, p)) : 0.5
}

function geometryBonus(item: StockSearchItem): number {
  const landscape = item.width >= item.height
  return (landscape ? 0.4 : 0) + (item.width >= 800 ? 0.6 : 0)
}

/** Build the verdict from CLEF answers + local geometry — pure, unit-tested. */
export function verdictFromAnswers(
  item: StockSearchItem,
  answers: Record<string, ClefAnswer>,
): StockCandidateVerdict {
  const p = {
    subject: prob(answers.subject),
    single: prob(answers.single),
    clean: prob(answers.clean),
    appetizing: prob(answers.appetizing),
  }
  const base = Object.entries(WEIGHTS).reduce((sum, [key, weight]) => sum + weight * p[key as keyof typeof p], 0)
  const score = Math.round(Math.min(10, (base * 0.7 + geometryBonus(item) * 0.3) * 10) * 10) / 10
  // Editorial posture: the model must EXCLUDE, not admit — an uncertain 0.5 passes.
  const keep = p.subject >= 0.5 && p.single >= 0.5 && p.clean >= 0.5

  const pct = (v: number) => `${Math.round(v * 100)} %`
  const geo = `${item.width >= item.height ? 'paysage' : 'portrait'} ${item.width}x${item.height}`
  let reason: string
  if (p.subject <= 0.5) {
    reason = `Sujet hors cible (${pct(p.subject)} de confiance) — écarté.`
  } else if (p.single <= 0.5) {
    reason = `Sujet non isolé (${pct(p.single)}) — écarté.`
  } else if (p.clean <= 0.5) {
    reason = `Surcouche probable : texte/logo (${pct(p.clean)}) — écarté.`
  } else {
    reason = `Sujet confirmé (${pct(p.subject)}), propre (${pct(p.clean)}), appétissant (${pct(p.appetizing)}) — ${geo}.`
  }

  return { id: item.id, score, keep, reason }
}

/**
 * Decision-model pass over stock candidates with CLEF-flash (multimodal): one
 * call per candidate — the model SEES the photo, not just the alt text — and
 * answers typed editorial questions with probabilities. Falls back to provider
 * order on any failure so the search tool never breaks.
 */
export async function rerankStockCandidates(
  event: H3Event,
  query: string,
  items: StockSearchItem[],
): Promise<StockRerankResult> {
  if (!items.length) {
    return { ranking: [], recommendedId: null, ranked: false }
  }

  const env = getCloudflareEnv(event)
  const hasBinding = Boolean(env?.AI)
  const hasRest = Boolean(env?.CLOUDFLARE_ACCOUNT_ID && env?.CLOUDFLARE_AI_API_TOKEN)
  if (!hasBinding && !hasRest) {
    return { ranking: normalizeVerdicts(items, []), recommendedId: null, ranked: false }
  }

  const capped = items.slice(0, MAX_CANDIDATES)
  const questions = candidateQuestions(query)
  // Prefer the binding; fall back to the Workers AI REST API when the runtime
  // model registry (pinned by the compat date, see infra/workers.ts) predates
  // CLEF — `ai.run` then fails with "setting '#options'".
  const runModel = createClefRunner(event)

  const settled = await Promise.allSettled(capped.map(async (item) => {
    const image = await fetchStockPreviewImage(item)
    const response = await runModel({
      model: 'clef-flash',
      state: `Recipe-blog stock candidate. Query: "${query}". Alt text: ${item.alt || '(none)'}. Dimensions: ${item.width}x${item.height}.`,
      questions,
      ...(image ? { images: [image] } : {}),
    })
    return verdictFromAnswers(item, response.answers ?? {})
  }))

  // Surface per-candidate failure reasons — the MCP response is where we debug
  // model availability; never break the search itself.
  const verdicts = settled.map((r, i) => {
    if (r.status === 'fulfilled') return r.value
    const message = r.reason instanceof Error ? r.reason.message : String(r.reason)
    return {
      id: capped[i].id,
      score: -1,
      keep: true,
      reason: `Évaluation indisponible : ${message.slice(0, 160)}`,
    }
  })

  const ranking = normalizeVerdicts(capped, verdicts)
  const best = ranking.find(v => v.keep && v.score > 0)
  return { ranking, recommendedId: best?.id ?? null, ranked: settled.some(r => r.status === 'fulfilled') }
}

/** Fetch a small preview for CLEF vision — max ~350px tall (Pexels `medium`), JPEG/WebP. */
async function fetchStockPreviewImage(item: StockSearchItem): Promise<string | null> {
  const url = item.src?.medium || item.src?.small
  if (!url) return null
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) return null
    const buffer = await res.arrayBuffer()
    if (buffer.byteLength > 4 * 1024 * 1024) return null
    const contentType = res.headers.get('content-type') ?? 'image/jpeg'
    const bytes = new Uint8Array(buffer)
    let binary = ''
    const chunk = 0x8000
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
    }
    return `data:${contentType};base64,${btoa(binary)}`
  }
  catch {
    return null
  }
}

/** Normalize verdicts: sort by score desc, keep failed/skipped candidates unscored. Pure — unit-tested. */
export function normalizeVerdicts(
  items: StockSearchItem[],
  verdicts: Array<StockCandidateVerdict | { id: string, score: number, keep: boolean, reason: string }>,
): StockCandidateVerdict[] {
  const byId = new Map(items.map(item => [item.id, item]))
  const seen = new Set<string>()
  const out: StockCandidateVerdict[] = []
  for (const raw of verdicts) {
    const id = typeof raw?.id === 'string' ? raw.id : ''
    if (!id || !byId.has(id) || seen.has(id)) continue
    seen.add(id)
    const score = Number(raw.score)
    out.push({
      id,
      score: Number.isFinite(score) ? Math.max(-1, Math.min(10, score)) : -1,
      keep: raw.keep === true,
      reason: typeof raw.reason === 'string' && raw.reason.trim()
        ? raw.reason.trim().slice(0, 240)
        : 'Sans justification du modèle.',
    })
  }
  for (const item of items) {
    if (!seen.has(item.id)) {
      out.push({ id: item.id, score: -1, keep: true, reason: 'Évaluation indisponible.' })
    }
  }
  return out.sort((a, b) => b.score - a.score)
}
