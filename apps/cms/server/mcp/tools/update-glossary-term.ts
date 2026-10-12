import { validateBody } from '../../utils/validate'
import { updateGlossaryTermMutation } from '../../services/glossary-mutations'
import { updateGlossaryTermSchema } from '../../utils/validations/glossary'
import { requireMcpTool } from '../utils/actor'
import { mcpGlossaryResult } from '../utils/content-result'
import { mcpContentToolEnabled } from '../utils/enabled'
import { MCP_UPDATE, mcpIdInput, mcpUpdateGlossaryInput } from '../utils/payload'

export default defineMcpTool({
  description: 'Update a glossary term in place. Does not publish or unpublish. iconKey must be a semantic allowlist key, never i-mdi-…. parentId links a culinary form to its family root (Amande). Returns previewUrl.',
  annotations: MCP_UPDATE,
  inputSchema: {
    ...mcpIdInput,
    ...mcpUpdateGlossaryInput,
  },
  enabled: event => mcpContentToolEnabled(event, 'glossary'),
  handler: async ({ id, ...patch }) => {
    const { event, actor } = requireMcpTool('glossary')
    const data = validateBody(updateGlossaryTermSchema, patch)
    await updateGlossaryTermMutation(event, actor, id, data, { tool: 'update-glossary-term' })
    return mcpGlossaryResult(event, id)
  },
})
