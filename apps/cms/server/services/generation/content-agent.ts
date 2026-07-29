import { ToolLoopAgent, hasToolCall, isStepCount, tool, type ToolSet } from 'ai'
import { createWorkersAI } from 'workers-ai-provider'
import { z } from 'zod'
import type { GenerationTargetType } from '../../db/queries/content-generation'
import {
  llmArticleExtractSchema,
  llmRecipeExtractSchema,
  type LlmArticleExtract,
  type LlmRecipeExtract,
} from '../../utils/validations/llm-extract'
import type { SourcePack } from './step-runner'
import {
  createSeoMcpClient,
  loadSeoMcpTools,
  readSeoMcpConfig,
} from './seo-mcp'

const WORKERS_AI_MODEL = '@cf/google/gemma-4-26b-a4b-it' as const
const SITE_HINT = 'journalducuistot.fr'

export type SourceKind = 'paste' | 'article' | 'ebook'

export interface ContentAgentRevisionBrief {
  round: number
  reviewNote: string
  focusSteps?: string[] | null
}

export interface ContentAgentExtractResult {
  extract: LlmArticleExtract | LlmRecipeExtract
  provider: 'content-agent'
  seoToolsUsed: string[]
  extractedAt: string
}

function chunkMarkdown(markdown: string, chunkSize = 3500) {
  const chunks: Array<{ index: number, text: string }> = []
  for (let offset = 0, index = 0; offset < markdown.length; offset += chunkSize, index += 1) {
    chunks.push({
      index,
      text: markdown.slice(offset, offset + chunkSize),
    })
  }
  return chunks
}

function agentInstructions(
  targetType: GenerationTargetType,
  locale: string,
  hasSeoBrief: boolean,
  hasSeoTools: boolean,
  isRevision: boolean,
) {
  const seoBlock = hasSeoBrief
    ? 'A keyword brief is available via get_keyword_brief — fold primary/secondary keywords into title, excerpt, and headings naturally (no stuffing).'
    : hasSeoTools
      ? [
          'You have Nuxt SEO Pro MCP tools (keyword_research, content_briefs, …).',
          `Use them for French keywords relevant to ${SITE_HINT} before writing the extract.`,
          'Fold primary/secondary keywords into title, excerpt, and headings naturally — no stuffing.',
        ].join(' ')
      : 'SEO tools/brief unavailable; still write SEO-friendly FR copy from the source alone.'

  const revisionBlock = isRevision
    ? 'This is a REVISION pass. Apply the human review notes from get_revision_brief. Keep what already works; fix only what the reviewer asked for. Cite evidenceChunks from the source.'
    : null

  return [
    'You are the Journal du Cuistot in-app content agent.',
    `Target: ${targetType}. Locale: ${locale}.`,
    'Read the source with get_source / list_source_chunks / read_source_chunk.',
    revisionBlock,
    seoBlock,
    'When ready, call submit_extract exactly once with the full structured payload + evidenceChunks citing the source.',
    'Never invent slug, status, category, cover, or publish fields.',
    'Do not finish with plain text — always submit_extract.',
  ].filter(Boolean).join(' ')
}

function buildPrompt(input: {
  targetType: GenerationTargetType
  locale: string
  source: SourcePack
  hasSeoBrief: boolean
  isRevision: boolean
}) {
  return [
    input.isRevision
      ? `Revise the structured ${input.targetType} extract in locale=${input.locale} using human review notes.`
      : `Produce a structured ${input.targetType} extract in locale=${input.locale}.`,
    `sourceKind=${input.source.sourceKind ?? 'paste'}`,
    input.source.title ? `titleHint=${input.source.title}` : null,
    input.source.sourceUrl ? `sourceUrl=${input.source.sourceUrl}` : null,
    input.isRevision
      ? 'Steps: (1) get_revision_brief (2) read source (3) get_keyword_brief if useful (4) submit_extract.'
      : input.hasSeoBrief
        ? 'Steps: (1) read source (2) get_keyword_brief (3) submit_extract.'
        : 'Steps: (1) read source (2) research keywords if tools available (3) submit_extract.',
  ].filter(Boolean).join('\n')
}

/**
 * In-app ToolLoopAgent: reads source (+ optional SEO brief) → submit_extract.
 */
export async function runContentExtractAgent(input: {
  ai: Ai
  targetType: GenerationTargetType
  locale: string
  source: SourcePack
  keywordBrief?: unknown
  revisionBrief?: ContentAgentRevisionBrief | null
}): Promise<ContentAgentExtractResult> {
  if (!input.source.markdown?.trim()) {
    throw new Error('Source pack markdown is required for the content agent')
  }

  const chunks = chunkMarkdown(input.source.markdown)
  let submitted: LlmArticleExtract | LlmRecipeExtract | null = null
  const seoToolsUsed: string[] = []
  const hasSeoBrief = input.keywordBrief != null
    && typeof input.keywordBrief === 'object'
    && !(input.keywordBrief as { skipped?: boolean }).skipped
  const isRevision = Boolean(input.revisionBrief?.reviewNote?.trim())

  const extractSchema = input.targetType === 'article'
    ? llmArticleExtractSchema
    : llmRecipeExtractSchema

  const sourceTools = {
    get_source: tool({
      description: 'Return SourcePack metadata and a short preview of the source text',
      inputSchema: z.object({}),
      execute: async () => ({
        sourceKind: input.source.sourceKind ?? 'paste',
        title: input.source.title ?? null,
        locale: input.source.locale ?? input.locale,
        sourceUrl: input.source.sourceUrl ?? null,
        charCount: input.source.markdown!.length,
        chunkCount: chunks.length,
        preview: input.source.markdown!.slice(0, 1200),
      }),
    }),
    list_source_chunks: tool({
      description: 'List chunk indexes for long sources (ebook / long article)',
      inputSchema: z.object({}),
      execute: async () => ({
        chunkCount: chunks.length,
        chunks: chunks.map(chunk => ({
          index: chunk.index,
          preview: chunk.text.slice(0, 160),
        })),
      }),
    }),
    read_source_chunk: tool({
      description: 'Read one source chunk by index',
      inputSchema: z.object({
        index: z.number().int().min(0),
      }),
      execute: async ({ index }) => {
        const chunk = chunks[index]
        if (!chunk) {
          return { error: `Chunk ${index} not found`, chunkCount: chunks.length }
        }
        return chunk
      },
    }),
    get_keyword_brief: tool({
      description: 'Return the pre-gathered SEO keyword brief for this run',
      inputSchema: z.object({}),
      execute: async () => input.keywordBrief ?? { skipped: true },
    }),
    get_revision_brief: tool({
      description: 'Return human review notes for this revision pass',
      inputSchema: z.object({}),
      execute: async () => input.revisionBrief ?? { skipped: true },
    }),
    submit_extract: tool({
      description: 'Submit the final structured article/recipe extract (call once when done)',
      inputSchema: extractSchema,
      execute: async (payload) => {
        const parsed = extractSchema.safeParse(payload)
        if (!parsed.success) {
          return { ok: false, error: parsed.error.message }
        }
        submitted = parsed.data
        return { ok: true }
      },
    }),
  }

  // Prefer cached brief from keyword_research step; only attach live MCP if no brief.
  const seoConfig = hasSeoBrief || isRevision ? null : readSeoMcpConfig()
  let mcpClient: Awaited<ReturnType<typeof createSeoMcpClient>> | undefined
  let seoTools: ToolSet = {}

  try {
    if (seoConfig) {
      mcpClient = await createSeoMcpClient(seoConfig)
      seoTools = await loadSeoMcpTools(mcpClient)
      seoToolsUsed.push(...Object.keys(seoTools))
    }
    else if (hasSeoBrief) {
      seoToolsUsed.push('keyword_brief')
    }

    const workersai = createWorkersAI({ binding: input.ai })
    const agent = new ToolLoopAgent({
      model: workersai(WORKERS_AI_MODEL),
      instructions: agentInstructions(
        input.targetType,
        input.locale,
        hasSeoBrief,
        seoToolsUsed.length > 0 && !hasSeoBrief,
        isRevision,
      ),
      tools: {
        ...sourceTools,
        ...seoTools,
      },
      stopWhen: [hasToolCall('submit_extract'), isStepCount(24)],
      temperature: 0.2,
      maxOutputTokens: 4096,
    })

    await agent.generate({
      prompt: buildPrompt({
        targetType: input.targetType,
        locale: input.locale,
        source: input.source,
        hasSeoBrief,
        isRevision,
      }),
    })
  }
  finally {
    await mcpClient?.close()
  }

  if (!submitted) {
    throw new Error('Content agent finished without submit_extract')
  }

  return {
    extract: submitted,
    provider: 'content-agent',
    seoToolsUsed,
    extractedAt: new Date().toISOString(),
  }
}
