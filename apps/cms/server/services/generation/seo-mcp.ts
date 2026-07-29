import { createMCPClient, type MCPClient } from '@ai-sdk/mcp'
import type { ToolSet } from 'ai'

const SEO_TOOL_ALLOWLIST = new Set([
  'keyword_research',
  'content_briefs',
  'list_sites',
  'competitors',
  'link_opportunities',
  'domain_info',
])

export interface SeoMcpConfig {
  url: string
  apiKey: string
}

export function readSeoMcpConfig(): SeoMcpConfig | null {
  const config = useRuntimeConfig()
  const apiKey = String(config.nuxtSeoProApiKey || '').trim()
  const url = String(config.nuxtSeoProMcpUrl || 'https://nuxtseo.com/mcp/pro').trim()
  if (!apiKey) {
    return null
  }
  return { url, apiKey }
}

/**
 * HTTP MCP client for Nuxt SEO Pro — used by the in-app content agent only.
 * Close the client after the agent run finishes.
 */
export async function createSeoMcpClient(config: SeoMcpConfig): Promise<MCPClient> {
  return createMCPClient({
    transport: {
      type: 'http',
      url: config.url,
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
      },
    },
  })
}

export async function loadSeoMcpTools(client: MCPClient): Promise<ToolSet> {
  const tools = await client.tools()
  return Object.fromEntries(
    Object.entries(tools).filter(([name]) => SEO_TOOL_ALLOWLIST.has(name)),
  )
}
