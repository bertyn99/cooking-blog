import { generateText, Output } from 'ai'
import { z } from 'zod'
import { STOCK_RERANK_MODEL } from '../../../shared/workers-ai-model'
import { createCmsWorkersAI } from '../../utils/cms-workers-ai'
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

const MAX_CANDIDATES = 12

const RERANK_SYSTEM_PROMPT = [
  'You rank stock-photo candidates for a French cooking blog (journalducuistot.fr).',
  'Given a search query and candidate metadata (alt text, dimensions), score each candidate 0-10 and mark keep true/false.',
  'Apply these criteria in order:',
  '1. Subject match — the alt text must describe the queried dish or subject (close variant or key ingredients acceptable).',
  '2. Single clear subject — reject collages, multi-dish flat lays, or unrelated scenes.',
  '3. Food-photography quality — appetizing, styled or natural presentation; reject raw-ingredient shots when the query is a finished dish (and vice versa).',
  '4. No overlays — reject when the alt hints at text, watermarks, packaging, logos, or non-food graphics.',
  '5. Usable geometry — landscape, at least 800px wide (the site renders 4:3 crops around 800px); portrait only acceptable if score is otherwise high.',
  'keep is false when any of criteria 1, 2 or 4 fails; otherwise true.',
  'reason: one short French sentence citing the deciding criterion.',
  'Rank strictly by score descending. Never invent candidate ids.',
].join('\n')

const verdictSchema = Output.object({
  schema: z.object({
    verdicts: z.array(z.object({
      id: z.string(),
      score: z.number(),
      keep: z.boolean(),
      reason: z.string(),
    })),
  }),
  name: 'stock_verdicts',
  description: 'Per-candidate fitness verdicts for the queried subject',
})

function candidateBrief(item: StockSearchItem): string {
  return [
    `id: ${item.id}`,
    `alt: ${item.alt || '(none)'}`,
    `${item.width}x${item.height}`,
    `orientation: ${item.width >= item.height ? 'landscape' : 'portrait'}`,
  ].join(' | ')
}

/**
 * Normalize raw model output into verdicts: drop unknown ids, clamp scores,
 * sort by score descending. Pure — unit-tested without any model call.
 */
export function normalizeVerdicts(
  items: StockSearchItem[],
  verdicts: Array<{ id?: unknown, score?: unknown, keep?: unknown, reason?: unknown }>,
): StockCandidateVerdict[] {
  const byId = new Map(items.map(item => [item.id, item]))
  const seen = new Set<string>()
  const out: StockCandidateVerdict[] = []
  for (const raw of verdicts) {
    const id = typeof raw.id === 'string' ? raw.id : ''
    if (!id || !byId.has(id) || seen.has(id)) continue
    seen.add(id)
    const score = Number(raw.score)
    const finite = Number.isFinite(score) ? score : 0
    out.push({
      id,
      score: Math.max(0, Math.min(10, Math.round(finite * 10) / 10)),
      keep: raw.keep === true,
      reason: typeof raw.reason === 'string' && raw.reason.trim()
        ? raw.reason.trim().slice(0, 240)
        : 'Sans justification du modèle.',
    })
  }
  // Candidates the model skipped keep provider order at the tail, unscored.
  for (const item of items) {
    if (!seen.has(item.id)) {
      out.push({ id: item.id, score: -1, keep: true, reason: 'Non évalué par le modèle.' })
    }
  }
  return out.sort((a, b) => b.score - a.score)
}

function resolveGatewayId(event: H3Event): string | undefined {
  try {
    const env = getCloudflareEnv(event)
    if (env?.CMS_AI_GATEWAY_ID) return String(env.CMS_AI_GATEWAY_ID)
  }
  catch {
    // No Nitro context (unit tests) — no gateway.
  }
  return undefined
}

/**
 * Decision-model pass over stock candidates: enumerates the editorial criteria
 * (subject match, single subject, food photography, no overlays, geometry) and
 * scores each candidate with the wired Workers AI text model. Metadata-only —
 * the model sees alt text and dimensions, not pixels. Falls back to provider
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

  const ai = getCloudflareEnv(event)?.AI
  if (!ai) {
    return { ranking: normalizeVerdicts(items, []), recommendedId: null, ranked: false }
  }

  const capped = items.slice(0, MAX_CANDIDATES)
  try {
    const workersai = createCmsWorkersAI(ai, {
      gatewayId: resolveGatewayId(event),
      metadata: { surface: 'stock-rerank' },
    })
    const model = workersai(STOCK_RERANK_MODEL)

    const { output } = await generateText({
      model,
      system: RERANK_SYSTEM_PROMPT,
      prompt: [
        `Query: ${query}`,
        'Candidates:',
        ...capped.map((item, i) => `${i + 1}. ${candidateBrief(item)}`),
      ].join('\n'),
      maxOutputTokens: 1500,
      temperature: 0,
      output: verdictSchema,
    })

    const raw = output?.verdicts ?? []
    const ranking = normalizeVerdicts(capped, raw)
    const best = ranking.find(v => v.keep && v.score > 0)
    return { ranking, recommendedId: best?.id ?? null, ranked: true }
  }
  catch {
    return { ranking: normalizeVerdicts(capped, []), recommendedId: null, ranked: false }
  }
}
