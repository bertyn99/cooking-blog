import { validateBody } from '../../utils/validate'
import { createApiError } from '../../utils/errors'
import { createRecipeCategorySchema } from '../../utils/validations/categories'
import { slugifyString } from '../../utils/slug'
import { useQueries } from '../../utils/db'
import { requireMcpTool } from '../utils/actor'
import { mcpContentToolEnabled } from '../utils/enabled'
import { MCP_CREATE, mcpCreateRecipeCategoryInput } from '../utils/payload'

export default defineMcpTool({
  description: 'Create a recipe category (taxonomy used by recipes) as draft. The human publishes it in the admin. Slug is reserved from the name automatically. Call before setting categoryId on a recipe that needs a new category.',
  annotations: MCP_CREATE,
  inputSchema: mcpCreateRecipeCategoryInput,
  enabled: event => mcpContentToolEnabled(event, 'recipes'),
  handler: async (input) => {
    const { event } = requireMcpTool('recipes')
    const data = validateBody(createRecipeCategorySchema, { ...input, status: 'draft' })
    const { categories } = useQueries(event)

    const slug = await categories.reserveUniqueSlug(slugifyString(data.name), data.locale)
    const now = new Date().toISOString()

    const category = await categories.insert({
      name: data.name,
      desc: data.desc ?? null,
      slug,
      locale: data.locale,
      localeGroupId: data.localeGroupId ?? null,
      status: 'draft',
      publishedAt: null,
      createdAt: now,
      updatedAt: now,
    })

    if (!category) {
      throw createApiError('INTERNAL_ERROR', 'Impossible de créer la catégorie.')
    }

    return { ...category, writable: true }
  },
})
