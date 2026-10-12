import { z } from 'zod'
import { requireMcpTool } from '../utils/actor'
import { mcpContentToolEnabled } from '../utils/enabled'
import { MCP_READ_ONLY } from '../utils/payload'
import {
  GLOSSARY_UTENSIL_CATEGORIES,
  listGlossaryIcons,
} from '../../../shared/glossary-icons'

export default defineMcpTool({
  description: 'List utensil icon keys (semantic allowlist mapped to Iconify). Never store i-lucide-/i-mdi- strings on the term — store the key (pan, pot, …).',
  annotations: MCP_READ_ONLY,
  inputSchema: {
    utensilCategory: z.enum(GLOSSARY_UTENSIL_CATEGORIES).optional()
      .describe('Optional family: cuisson | preparation | mesure | electro | service'),
  },
  enabled: event => mcpContentToolEnabled(event, 'glossary'),
  handler: async ({ utensilCategory }) => {
    requireMcpTool('glossary')
    return { data: listGlossaryIcons(utensilCategory) }
  },
})
