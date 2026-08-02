import type { GenerationTargetType } from '../../db/queries/content-generation'
import { getCloudflareEnv } from '../../utils/cloudflare-env'
import type { LlmArticleExtract, LlmRecipeExtract } from '../../utils/validations/llm-extract'
import { runContentExtractAgent } from './content-agent'
import { createHeuristicLlmClient } from './llm-client'
import type { SourcePack } from './step-runner'

export interface RunLlmExtractInput {
  targetType: GenerationTargetType
  source: SourcePack | null
  locale: string
  /** Optional brief from keyword_research step (preferred over live SEO MCP). */
  keywordBrief?: unknown
  /** Human review notes for revise rounds. */
  revisionBrief?: {
    round: number
    reviewNote: string
    focusSteps?: string[] | null
  } | null
  /** Explicit AI binding (Workflows); falls back to getCloudflareEnv().AI */
  ai?: Ai
  /** AI Gateway id (Workflows / env); falls back to getCloudflareEnv().CMS_AI_GATEWAY_ID */
  gatewayId?: string
}

export type ExtractRunResult = (LlmArticleExtract | LlmRecipeExtract) & {
  extractedAt: string
  provider: string
  seoToolsUsed?: string[]
}

/**
 * Prefer in-app ToolLoopAgent (Gemma 4) when Workers AI is bound.
 * Falls back to heuristic extract when AI is unavailable (local without binding).
 */
export async function runLlmExtract(input: RunLlmExtractInput): Promise<ExtractRunResult> {
  if (!input.source?.markdown?.trim()) {
    throw new Error('Source pack markdown is required for extract')
  }

  const env = getCloudflareEnv()
  const ai = input.ai ?? env?.AI
  if (ai) {
    const result = await runContentExtractAgent({
      ai,
      gatewayId: input.gatewayId ?? env?.CMS_AI_GATEWAY_ID,
      targetType: input.targetType,
      locale: input.locale,
      source: input.source,
      keywordBrief: input.keywordBrief,
      revisionBrief: input.revisionBrief,
    })
    return {
      ...result.extract,
      extractedAt: result.extractedAt,
      provider: result.provider,
      seoToolsUsed: result.seoToolsUsed,
    }
  }

  const extracted = await createHeuristicLlmClient().extract({
    targetType: input.targetType,
    locale: input.locale,
    title: input.source.title,
    markdown: input.source.markdown,
    sourceUrl: input.source.sourceUrl,
  })

  return {
    ...extracted,
    extractedAt: new Date().toISOString(),
    provider: 'heuristic',
  }
}
