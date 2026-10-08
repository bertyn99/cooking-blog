import { z } from 'zod'
import {
  getPexelsApiKey,
  searchPexels,
  type StockOrientation,
} from '../../services/stock/pexels'
import { requireMcpMediaTool } from '../utils/actor'
import { mcpMediaListEnabled } from '../utils/enabled'
import { MCP_READ_ONLY } from '../utils/payload'
import { rerankStockCandidates } from '../../services/stock/rerank'

export default defineMcpTool({
  description: `Search Pexels stock photos for a dish or subject. Returns per photo: id, alt, width/height, avg_color, photographer, pageUrl, previewUrl — plus a decision-model ranking (rerank, default on): each candidate scored 0-10 against editorial criteria with a keep flag and a short French reason, and a recommendedId. Import with import-stock-media (recommendedId first; check keep=false reasons before overriding). Only search when list-media has no adequate existing image. Rate limited: 60/min.`,
  annotations: MCP_READ_ONLY,
  inputSchema: {
    query: z.string().trim().min(1).max(200).describe(
      'Search query — dish or subject with key ingredients, e.g. "bruschetta tomato basil"',
    ),
    orientation: z.enum(['landscape', 'portrait', 'square']).default('landscape')
      .describe('Landscape fits article/recipe images (4:3)'),
    perPage: z.number().int().min(1).max(40).default(8),
    page: z.number().int().min(1).default(1),
    locale: z.string().max(16).default('fr-FR'),
    rerank: z.boolean().default(true).describe(
      'Run the decision model over candidates: scores each against editorial criteria (subject match, single subject, food photography, no text overlays, geometry) and returns ranking + recommendedId. Disable only for debugging.',
    ),
  },
  enabled: event => mcpMediaListEnabled(event) && Boolean(getPexelsApiKey()),
  handler: async ({ query, orientation, perPage, page, locale, rerank }) => {
    const { event } = requireMcpMediaTool()
    const result = await searchPexels({
      query,
      page,
      perPage,
      orientation: orientation as StockOrientation,
      locale,
    })

    if (!rerank) {
      return { ...result, ranking: null, recommendedId: null, ranked: false }
    }

    // Decision-model pass: scores candidates against the editorial criteria
    // (subject match, single subject, food photography, no overlays, geometry).
    // Falls back to provider order on failure — the search never breaks.
    const verdict = await rerankStockCandidates(event, query, result.items)
    return { ...result, ...verdict }
  },
})
