import { validateBody } from '../../utils/validate'
import { createApiError } from '../../utils/errors'
import { createGlossaryTermMutation } from '../../services/glossary-mutations'
import { createGlossaryTermSchema } from '../../utils/validations/glossary'
import { requireMcpTool } from '../utils/actor'
import { mcpGlossaryResult } from '../utils/content-result'
import { mcpContentToolEnabled } from '../utils/enabled'
import { MCP_CREATE, mcpCreateGlossaryInput } from '../utils/payload'

export default defineMcpTool({
  description: 'Create a glossary term as draft + noindex. Never publishes. iconKey is semantic (pan, pot…) for utensils only. Culinary forms (lait d’amande) are separate terms with parentId pointing at the family root (Amande). Aliases are synonyms only. Returns previewUrl.',
  annotations: MCP_CREATE,
  inputSchema: mcpCreateGlossaryInput,
  enabled: event => mcpContentToolEnabled(event, 'glossary'),
  handler: async (input) => {
    const { event, actor } = requireMcpTool('glossary')
    const data = validateBody(createGlossaryTermSchema, { ...input, status: 'draft' })
    const created = await createGlossaryTermMutation(event, actor, data, { tool: 'create-glossary-term' })
    if (!created) {
      throw createApiError('INTERNAL_ERROR', 'Impossible de créer le terme.')
    }
    return mcpGlossaryResult(event, created.id)
  },
})
