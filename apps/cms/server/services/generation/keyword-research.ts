import type { GenerationTargetType } from '../../db/queries/content-generation'
import type { SourcePack } from './step-runner'
import {
  createSeoMcpClient,
  loadSeoMcpTools,
  readSeoMcpConfig,
} from './seo-mcp'

export interface KeywordBrief {
  skipped: boolean
  seeds: string[]
  toolsUsed: string[]
  /** Opaque MCP / research payload for the extract agent. */
  research?: unknown
  error?: string
  gatheredAt: string
}

function seedKeywords(source: SourcePack | null): string[] {
  const seeds: string[] = []
  if (source?.title?.trim()) {
    seeds.push(source.title.trim())
  }
  const markdown = source?.markdown?.trim() ?? ''
  const heading = markdown.match(/^#\s+(.+)$/m)?.[1]?.trim()
  if (heading && heading !== seeds[0]) {
    seeds.push(heading)
  }
  if (seeds.length === 0 && markdown) {
    seeds.push(markdown.slice(0, 80).replace(/\s+/g, ' '))
  }
  return seeds.slice(0, 5)
}

/**
 * Soft keyword gather via Nuxt SEO Pro MCP. Never throws — callers treat as optional.
 */
export async function gatherKeywordBrief(input: {
  targetType: GenerationTargetType
  locale: string
  source: SourcePack | null
}): Promise<KeywordBrief> {
  const gatheredAt = new Date().toISOString()
  const seeds = seedKeywords(input.source)
  const config = readSeoMcpConfig()

  if (!config) {
    return {
      skipped: true,
      seeds,
      toolsUsed: [],
      error: 'NUXT_SEO_PRO_API_KEY not configured',
      gatheredAt,
    }
  }

  let client: Awaited<ReturnType<typeof createSeoMcpClient>> | undefined
  try {
    client = await createSeoMcpClient(config)
    const tools = await loadSeoMcpTools(client)
    const toolsUsed = Object.keys(tools)
    const keywordTool = tools.keyword_research

    let research: unknown
    if (keywordTool && typeof keywordTool.execute === 'function') {
      research = await keywordTool.execute(
        {
          type: 'research',
          keywords: seeds,
          locale: input.locale,
          site: 'journalducuistot.fr',
        },
        {
          toolCallId: `keyword-research-${Date.now()}`,
          messages: [],
        },
      )
    }

    return {
      skipped: false,
      seeds,
      toolsUsed,
      research: research ?? null,
      gatheredAt,
    }
  }
  catch (error) {
    return {
      skipped: true,
      seeds,
      toolsUsed: [],
      error: error instanceof Error ? error.message : String(error),
      gatheredAt,
    }
  }
  finally {
    await client?.close()
  }
}
