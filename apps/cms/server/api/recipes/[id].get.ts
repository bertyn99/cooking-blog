import { parseInclude } from '../../utils/populate'
import { createApiError } from '../../utils/errors'
import { useQueries } from '../../utils/db'
import { serializeRecipeForScope } from '../../utils/serialize-content'

export default defineEventHandler(async (event) => {
  const id = Number.parseInt(getRouterParam(event, 'id') || '', 10)
  if (Number.isNaN(id)) {
    throw createApiError('NOT_FOUND', 'Recipe not found')
  }

  const query = getQuery(event)
  const include = parseInclude(query as Record<string, unknown>)
  const session = await getUserSession(event)
  const scope = session.user ? 'admin' : 'public'
  const { recipes } = useQueries(event)
  const recipe = await recipes.findById(id, scope, include)

  if (!recipe) {
    throw createApiError('NOT_FOUND', 'Recipe not found')
  }

  return serializeRecipeForScope(recipe, scope)
})
